<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $disk = Storage::disk('profile');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'slug' => $this->slug,
            'avatar' => $this->avatar ? $disk->url($this->avatar) : null,
            'owner_id' => $this->owner_id,
            'owner' => $this->whenLoaded('owner', function () {
                return new UserResource($this->owner);
            }),
            'is_group' => true,
            'is_user' => false,
            'users' => $this->whenLoaded('members', function () {
                return UserResource::collection($this->members);
            }),
            'user_ids' => optional($this->members)->pluck('id') ?? collect(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
