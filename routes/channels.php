<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('online', function ($user) {
    return $user ? new \App\Http\Resources\UserResource($user) : null;
});

Broadcast::channel('group.{groupId}', function ($user, $groupId) {
    return $user && $user->groups->contains($groupId)
        ? new \App\Http\Resources\UserResource($user)
        : null;
});

Broadcast::channel('message.user.{userId1}-{userId2}', function ($user, $userId1, $userId2) {
    return $user && ($user->id == $userId1 || $user->id == $userId2)
        ? new \App\Http\Resources\UserResource($user)
        : null;
});
