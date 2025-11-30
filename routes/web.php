<?php

use App\Http\Controllers\GroupController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', [HomeController::class, 'home'])->name('home');

    Route::get('/user/{user}', [MessageController::class, 'byUser'])->name('chat.user');
    Route::get('/group/{group}', [MessageController::class, 'byGroup'])->name('chat.group');

    Route::post('/message', [MessageController::class, 'store'])->name('message.store');
    Route::patch('/message/{message}', [MessageController::class, 'update'])->name('message.update');
    Route::delete('/message/{message}', [MessageController::class, 'destroy'])->name('message.destroy');
    Route::get('/message/older/{message}', [MessageController::class, 'older'])->name('message.load.older');

    // User search and conversation routes
    Route::get('/users/search', [UserController::class, 'search'])->name('users.search');
    Route::post('/conversation/find-or-create', [UserController::class, 'findOrCreateConversation'])->name('conversation.find-or-create');

    // Group management routes
    Route::post('/group/store', [GroupController::class, 'store'])->name('group.store');
    Route::patch('/group/{group}', [GroupController::class, 'update'])->name('group.update');
    Route::delete('/group/{group}', [GroupController::class, 'destroy'])->name('group.destroy');
    Route::post('/group/{group}/invite', [GroupController::class, 'invite'])->name('group.invite');
    Route::post('/group/{group}/member/{user}/role', [GroupController::class, 'updateMemberRole'])->name('group.member.role');
    Route::delete('/group/{group}/member/{user}', [GroupController::class, 'removeMember'])->name('group.member.remove');
    Route::post('/group/{group}/transfer-ownership/{user}', [GroupController::class, 'transferOwnership'])->name('group.transfer-ownership');
    Route::delete('/group/{group}/avatar', [GroupController::class, 'removeAvatar'])->name('group.avatar.remove');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
