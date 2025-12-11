<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('online', function ($user) {
    return $user ? new \App\Http\Resources\UserResource($user) : null;
});

Broadcast::channel('user.{userId}', function ($user, $userId) {
    return $user && $user->id == $userId
        ? new \App\Http\Resources\UserResource($user)
        : null;
});

Broadcast::channel('group.{groupId}', function ($user, $groupId) {
    // Check if user is a member of the group OR the owner of the group
    $isMember = $user->groups->contains($groupId);
    $isOwner = \App\Models\Group::where('id', $groupId)->where('owner_id', $user->id)->exists();
    
    return $user && ($isMember || $isOwner)
        ? new \App\Http\Resources\UserResource($user)
        : null;
});

Broadcast::channel('message.group.{groupId}', function ($user, $groupId) {
    // Check if user is a member of the group OR the owner of the group
    $isMember = $user->groups->contains($groupId);
    $isOwner = \App\Models\Group::where('id', $groupId)->where('owner_id', $user->id)->exists();
    
    return $user && ($isMember || $isOwner)
        ? new \App\Http\Resources\UserResource($user)
        : null;
});

Broadcast::channel('message.user.{userId1}-{userId2}', function ($user, $userId1, $userId2) {
    return $user && ($user->id == $userId1 || $user->id == $userId2)
        ? new \App\Http\Resources\UserResource($user)
        : null;
});
