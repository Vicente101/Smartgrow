<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AdviceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'location' => ['required_without_all:latitude,longitude', 'nullable', 'string', 'min:2', 'max:150'],
            'latitude' => ['required_with:longitude', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['required_with:latitude', 'nullable', 'numeric', 'between:-180,180'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'soil_type' => ['nullable', 'in:unknown,sandy,loamy,clay,silty,peaty,chalky'],
            'irrigation' => ['nullable', 'in:none,supplemental,reliable'],
        ];
    }

    public function messages(): array
    {
        return [
            'location.required_without_all' => 'Enter a town or allow access to your current location.',
        ];
    }
}
