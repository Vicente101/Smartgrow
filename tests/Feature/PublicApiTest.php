<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        Http::preventStrayRequests();
    }

    public function test_location_search_is_normalised(): void
    {
        Http::fake(['geocoding-api.open-meteo.com/*' => Http::response(['results' => [[
            'name' => 'Ndola', 'admin1' => 'Copperbelt', 'country' => 'Zambia', 'country_code' => 'ZM',
            'latitude' => -12.96, 'longitude' => 28.63, 'timezone' => 'Africa/Lusaka',
        ]]])]);

        $this->getJson('/api/locations?q=Ndola')
            ->assertOk()
            ->assertJsonPath('data.0.label', 'Ndola, Copperbelt, Zambia')
            ->assertJsonPath('data.0.country_code', 'ZM');
    }

    public function test_agriculture_news_is_normalised(): void
    {
        Http::fake(['api.gdeltproject.org/*' => Http::response(['articles' => [[
            'title' => 'Farmers prepare for the new planting season',
            'url' => 'https://example.com/farming-story',
            'domain' => 'example.com',
            'sourcecountry' => 'Zambia',
            'language' => 'English',
            'seendate' => '20260804T080000Z',
        ]]])]);

        $this->getJson('/api/news?location=Zambia')
            ->assertOk()
            ->assertJsonPath('data.status', 'live')
            ->assertJsonPath('data.articles.0.domain', 'example.com');
    }

    public function test_contact_messages_are_validated_and_stored(): void
    {
        $payload = [
            'name' => 'Vincent Farmer',
            'email' => 'vincent@example.com',
            'subject' => 'Climate data question',
            'message' => 'Could you help me understand the rainfall baseline?',
            'location' => 'Ndola',
        ];

        $this->postJson('/api/contact', $payload)->assertCreated();

        $this->assertDatabaseHas(ContactMessage::class, [
            'email' => 'vincent@example.com',
            'subject' => 'Climate data question',
        ]);
    }

    public function test_the_react_application_shell_is_available_on_client_routes(): void
    {
        $this->get('/advisor')->assertOk()->assertSee('id="app"', false);
        $this->get('/news')->assertOk()->assertSee('Munda');
    }
}
