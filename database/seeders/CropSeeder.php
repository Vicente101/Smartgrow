<?php

namespace Database\Seeders;

use App\Models\Crop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CropSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->crops() as $crop) {
            Crop::query()->updateOrCreate(
                ['slug' => Str::slug($crop['name'])],
                [...$crop, 'slug' => Str::slug($crop['name'])],
            );
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function crops(): array
    {
        return [
            $this->crop('Maize', 'Zea mays', 'Cereal', 'A productive staple that responds well to timely rain and fertile, well-drained soil.', 10, 20, 30, 38, 35, 80, 160, 260, 40, 80, ['loamy', 'clay', 'silty'], 120, 'moderate', 'Plant at the onset of dependable rains; avoid waterlogged fields.'),
            $this->crop('Sorghum', 'Sorghum bicolor', 'Cereal', 'A heat-tolerant, drought-resilient grain suited to variable rainfall and lighter soils.', 12, 24, 34, 40, 20, 35, 100, 180, 30, 70, ['sandy', 'loamy', 'clay'], 115, 'low', 'Plant with the first effective rains; useful where dry spells are common.'),
            $this->crop('Pearl millet', 'Pennisetum glaucum', 'Cereal', 'A fast, hardy cereal for hot areas, sandy ground, and low or unreliable rainfall.', 15, 25, 35, 42, 15, 25, 85, 150, 25, 65, ['sandy', 'loamy'], 90, 'low', 'Sow shallowly after an effective rain and keep the seedbed weed-free.'),
            $this->crop('Wheat', 'Triticum aestivum', 'Cereal', 'A cool-season cereal that performs best with moderate temperatures and controlled moisture.', 3, 15, 23, 30, 20, 40, 100, 170, 35, 70, ['loamy', 'clay', 'silty'], 125, 'moderate', 'Best in the cool, dry season where irrigation can maintain even moisture.'),
            $this->crop('Rice', 'Oryza sativa', 'Cereal', 'A water-demanding cereal suited to warm, humid conditions and soils that retain moisture.', 16, 22, 32, 38, 80, 130, 280, 400, 60, 95, ['clay', 'silty'], 135, 'high', 'Use low-lying or irrigated land with reliable water management.'),
            $this->crop('Groundnut', 'Arachis hypogaea', 'Legume', 'A high-value legume that adds nitrogen and prefers loose, well-drained soil.', 15, 22, 30, 36, 25, 50, 120, 200, 35, 75, ['sandy', 'loamy'], 110, 'moderate', 'Plant into warm, friable soil after rain is established; avoid heavy waterlogging.'),
            $this->crop('Soybean', 'Glycine max', 'Legume', 'A protein-rich rotational crop with strong performance in warm, evenly moist conditions.', 10, 20, 30, 36, 35, 70, 150, 240, 45, 80, ['loamy', 'clay', 'silty'], 120, 'moderate', 'Plant once soil moisture is dependable; use the appropriate rhizobium inoculant.'),
            $this->crop('Common beans', 'Phaseolus vulgaris', 'Legume', 'A short-cycle food legume that prefers mild weather and good drainage.', 10, 18, 27, 34, 25, 50, 120, 190, 40, 75, ['loamy', 'silty'], 85, 'moderate', 'Avoid planting into very hot or saturated soil; protect flowering from moisture stress.'),
            $this->crop('Cowpea', 'Vigna unguiculata', 'Legume', 'A quick, drought-tolerant pulse that can produce under heat and modest rainfall.', 15, 22, 34, 40, 15, 30, 90, 160, 30, 75, ['sandy', 'loamy'], 75, 'low', 'A good option for late planting or drier fields after one effective soaking rain.'),
            $this->crop('Sunflower', 'Helianthus annuus', 'Oilseed', 'A deep-rooted oilseed with moderate water needs and good tolerance of short dry periods.', 8, 20, 29, 36, 20, 40, 110, 180, 30, 70, ['loamy', 'clay', 'sandy'], 105, 'low', 'Plant in a firm, well-drained seedbed; avoid extended wetness around maturity.'),
            $this->crop('Cotton', 'Gossypium hirsutum', 'Fibre', 'A long-season cash crop needing sustained warmth, early moisture, and dry harvest weather.', 15, 21, 32, 40, 25, 50, 120, 210, 35, 75, ['loamy', 'clay'], 170, 'moderate', 'Plant early in a warm rainy period and plan pest scouting from establishment.'),
            $this->crop('Cassava', 'Manihot esculenta', 'Root crop', 'A resilient root crop that tolerates dry periods once established and suits many tropical soils.', 15, 24, 30, 38, 20, 50, 160, 280, 40, 85, ['sandy', 'loamy', 'clay'], 300, 'moderate', 'Plant healthy cuttings into moist, well-drained ridges near the start of rains.'),
            $this->crop('Sweet potato', 'Ipomoea batatas', 'Root crop', 'A flexible, short-to-medium cycle root crop for warm weather and well-drained ridges.', 12, 21, 29, 36, 25, 50, 130, 220, 40, 80, ['sandy', 'loamy', 'silty'], 120, 'moderate', 'Plant clean vines on ridges when soil is moist but not saturated.'),
            $this->crop('Irish potato', 'Solanum tuberosum', 'Root crop', 'A cool-weather, high-value crop needing loose soil and consistent but controlled water.', 5, 14, 21, 28, 25, 50, 120, 180, 45, 80, ['sandy', 'loamy', 'silty'], 105, 'moderate', 'Use certified seed in cool conditions and maintain even moisture without waterlogging.'),
            $this->crop('Tomato', 'Solanum lycopersicum', 'Vegetable', 'A market vegetable suited to warm days, mild nights, and carefully managed water.', 8, 18, 28, 35, 15, 35, 90, 160, 40, 80, ['sandy', 'loamy', 'silty'], 100, 'moderate', 'Nursery-raise seedlings and transplant with reliable water; avoid overhead irrigation late in the day.'),
            $this->crop('Onion', 'Allium cepa', 'Vegetable', 'A cool-to-mild season crop that needs a fine seedbed and steady moisture early in growth.', 5, 13, 25, 32, 10, 25, 75, 130, 35, 70, ['sandy', 'loamy', 'silty'], 120, 'moderate', 'Best with irrigation in a dry period so bulbs can cure in dry weather.'),
            $this->crop('Cabbage', 'Brassica oleracea var. capitata', 'Vegetable', 'A cool-season leafy crop that needs fertile soil and reliable moisture.', 4, 15, 23, 30, 25, 50, 110, 180, 45, 85, ['loamy', 'clay', 'silty'], 95, 'moderate', 'Transplant in cooler conditions and monitor caterpillars and black rot closely.'),
            $this->crop('Sugarcane', 'Saccharum officinarum', 'Industrial', 'A long-duration tropical crop requiring abundant heat, moisture, and fertile deep soil.', 16, 24, 32, 38, 60, 110, 250, 380, 55, 90, ['loamy', 'clay', 'silty'], 420, 'high', 'Choose deep fertile land with dependable rainfall or year-round irrigation.'),
        ];
    }

    /** @return array<string, mixed> */
    private function crop(
        string $name,
        string $scientificName,
        string $category,
        string $description,
        float $tempMin,
        float $tempOptMin,
        float $tempOptMax,
        float $tempMax,
        float $rainfallMin,
        float $rainfallOptMin,
        float $rainfallOptMax,
        float $rainfallMax,
        int $humidityMin,
        int $humidityMax,
        array $soilTypes,
        int $cycleDays,
        string $waterNeed,
        string $plantingNote,
    ): array {
        return [
            'name' => $name,
            'scientific_name' => $scientificName,
            'category' => $category,
            'description' => $description,
            'temp_min' => $tempMin,
            'temp_opt_min' => $tempOptMin,
            'temp_opt_max' => $tempOptMax,
            'temp_max' => $tempMax,
            'rainfall_min' => $rainfallMin,
            'rainfall_opt_min' => $rainfallOptMin,
            'rainfall_opt_max' => $rainfallOptMax,
            'rainfall_max' => $rainfallMax,
            'humidity_min' => $humidityMin,
            'humidity_max' => $humidityMax,
            'soil_types' => $soilTypes,
            'cycle_days' => $cycleDays,
            'water_need' => $waterNeed,
            'planting_note' => $plantingNote,
        ];
    }
}
