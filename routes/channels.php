<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('online', function ($user) {
    return $user ? new \App\Http\Resources\UserResource($user) : null;
});
