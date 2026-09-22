<?php

namespace App\Http\Resources;

use App\Models\GroupMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactMessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $existingGroupMember = $this->findExistingGroupMember();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'subject' => $this->subject,
            'category' => $this->category,
            'status' => $this->status,
            'group_id' => $this->group_id,
            'group_name' => $this->whenLoaded('group', fn () => $this->group?->name),
            'is_existing_group_member' => (bool) $existingGroupMember,
            'existing_group_member_id' => $existingGroupMember?->id,
            'message' => $this->message,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function findExistingGroupMember(): ?GroupMember
    {
        if (! $this->group_id) {
            return null;
        }

        return GroupMember::query()
            ->where('group_id', $this->group_id)
            ->where(function ($query) {
                if ($this->email) {
                    $query->orWhere('email', strtolower($this->email));
                }

                if ($this->phone) {
                    $query->orWhere('phone', $this->phone);
                }

                if ($this->name) {
                    $query->orWhere('name', $this->name);
                }
            })
            ->first();
    }
}
