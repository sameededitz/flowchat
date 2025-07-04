<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MessageRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'message' => 'nullable|string|max:9999',
            'group_id' => 'required_without:receiver_id|nullable|exists:groups,id',
            'receiver_id' => 'required_without:group_id|nullable|exists:users,id',
            'attachments' => 'nullable|array|max:10',
            'attachments.*' => 'file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,wmv,flv,mp3,wav,ogg|max:1024000',
        ];
    }
}
