<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AgricultureNewsService
{
    /** @return array<string, mixed> */
    public function forLocation(string $location, ?string $country = null, int $limit = 18): array
    {
        $place = trim($country ?: $location);
        $cacheKey = 'ag-news:v5:'.sha1(mb_strtolower($place)).':'.$limit;

        try {
            $result = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($place, $limit) {
                try {
                    $articles = $this->fromGdelt($place, $limit);
                    if ($articles !== []) {
                        try {
                            $fallback = count($articles) < $limit ? $this->fromGoogleNews($place, $limit) : [];
                            $articles = collect([...$articles, ...$fallback])
                                ->unique(fn (array $article) => mb_strtolower($article['title']))
                                ->take($limit)
                                ->values()
                                ->all();

                            return ['source' => $fallback === [] ? 'GDELT Project' : 'GDELT + Google News', 'articles' => $articles];
                        } catch (\Throwable) {
                            return ['source' => 'GDELT Project', 'articles' => $articles];
                        }
                    }
                } catch (\Throwable) {
                    // The public GDELT service can be busy; use a second no-key feed.
                }

                return ['source' => 'Google News RSS', 'articles' => $this->fromGoogleNews($place, $limit)];
            });

            return [
                'status' => 'live',
                'source' => $result['source'],
                'location' => $place,
                'updated_at' => now()->toIso8601String(),
                'articles' => $result['articles'],
            ];
        } catch (\Throwable) {
            return [
                'status' => 'temporarily_unavailable',
                'source' => 'Agricultural news providers',
                'location' => $place,
                'updated_at' => now()->toIso8601String(),
                'articles' => [],
            ];
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function fromGdelt(string $place, int $limit): array
    {
        $query = '(agriculture OR farming OR crops OR harvest OR livestock) "'.$this->cleanQuery($place).'" sourcelang:english';
        $response = Http::acceptJson()
            ->connectTimeout(4)
            ->timeout(9)
            ->get(config('services.crop_intelligence.gdelt_url'), [
                'query' => $query,
                'mode' => 'ArtList',
                'maxrecords' => min(max($limit * 2, 20), 75),
                'format' => 'json',
                'sort' => 'datedesc',
                'timespan' => '3months',
            ])
            ->throw();

        return collect($response->json('articles', []))
            ->filter(fn (array $article) => ! empty($article['url']) && ! empty($article['title']))
            ->filter(fn (array $article) => in_array(mb_strtolower($article['language'] ?? 'english'), ['english', 'eng'], true))
            ->unique('url')
            ->take($limit)
            ->map(fn (array $article) => $this->normaliseGdelt($article))
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function fromGoogleNews(string $place, int $limit): array
    {
        $response = Http::withHeaders(['User-Agent' => config('app.name').'/1.0'])
            ->connectTimeout(4)
            ->timeout(10)
            ->get(config('services.crop_intelligence.google_news_url'), [
                'q' => '(agriculture OR farming OR crops OR harvest) "'.$this->cleanQuery($place).'" when:90d',
                'hl' => 'en',
                'gl' => 'US',
                'ceid' => 'US:en',
            ])
            ->throw();

        $xml = simplexml_load_string($response->body(), 'SimpleXMLElement', LIBXML_NONET | LIBXML_NOCDATA);
        if ($xml === false) {
            throw new RuntimeException('The fallback news feed returned invalid XML.');
        }

        return collect($xml->channel->item ?? [])
            ->take($limit)
            ->map(function ($item) {
                $title = trim((string) $item->title);
                $source = trim((string) ($item->source ?? 'Google News'));

                return [
                    'title' => $title,
                    'url' => (string) $item->link,
                    'image' => null,
                    'domain' => $source ?: 'Google News',
                    'source_country' => null,
                    'language' => 'English',
                    'published_at' => $this->parseDate((string) $item->pubDate),
                ];
            })
            ->filter(fn (array $article) => $article['title'] !== '' && $article['url'] !== '')
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function normaliseGdelt(array $article): array
    {
        return [
            'title' => trim(strip_tags($article['title'])),
            'url' => $article['url'],
            'image' => filter_var($article['socialimage'] ?? null, FILTER_VALIDATE_URL) ?: null,
            'domain' => $article['domain'] ?? parse_url($article['url'], PHP_URL_HOST),
            'source_country' => $article['sourcecountry'] ?? null,
            'language' => $article['language'] ?? null,
            'published_at' => $this->parseDate($article['seendate'] ?? null, 'Ymd\THis\Z'),
        ];
    }

    private function parseDate(?string $date, ?string $format = null): ?string
    {
        if (! $date) {
            return null;
        }

        try {
            return ($format ? Carbon::createFromFormat($format, $date, 'UTC') : Carbon::parse($date))->toIso8601String();
        } catch (\Throwable) {
            return null;
        }
    }

    private function cleanQuery(string $query): string
    {
        return mb_substr(preg_replace('/[^\pL\pN\s,.-]/u', '', $query) ?: '', 0, 100);
    }
}
