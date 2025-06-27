<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function home()
    {
        return Inertia::render('Home', [
            'title' => 'Welcome to Our Application',
            'description' => 'This is the home page of our application built with Laravel and Inertia.js.',
        ]);
    }
}
