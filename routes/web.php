<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Public website pages (Blade, server-rendered, SEO-friendly)
Route::middleware(['web'])->group(function () {
    Route::get('/', fn() => view('pages.home'))->name('home');
    Route::get('/features', fn() => view('pages.features'))->name('features');
    Route::get('/features/finance', fn() => view('pages.features-finance'));
    Route::get('/features/invoicing', fn() => view('pages.features-invoicing'));
    Route::get('/features/products', fn() => view('pages.features-products'));
    Route::get('/features/tasks', fn() => view('pages.features-tasks'));
    Route::get('/how-it-works', fn() => view('pages.how-it-works'));
    Route::get('/pricing', fn() => view('pages.pricing'))->name('pricing');
    Route::get('/install-app', fn() => view('pages.install-app'));
    Route::get('/faq', fn() => view('pages.faq'));
    Route::get('/privacy', fn() => view('pages.privacy'))->name('privacy');
    Route::get('/terms', fn() => view('pages.terms'))->name('terms');
    Route::get('/contact', fn() => view('pages.contact'))->name('contact');

    // Auth pages (Blade for SEO, forms post to API)
    Route::get('/login', fn() => view('auth.login'))->name('login');
    Route::get('/register', fn() => view('auth.register'))->name('register');
    Route::get('/password/reset', fn() => view('auth.forgot-password'));
    Route::get('/password/reset/{token}', fn($token) => view('auth.reset-password', ['token' => $token]));

    /*
     * Email verification.
     *
     * Laravel's VerifyEmail notification builds its link with
     * URL::temporarySignedRoute('verification.verify', ...), so this route must
     * exist and must be named exactly this. Without it, registration crashed
     * while sending the verification mail.
     */
    Route::get('/email/verify/{id}/{hash}', function (string $id, string $hash) {
        $user = \App\Models\User::findOrFail($id);

        // Confirms the link was issued for this user's current email address.
        if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            abort(403, 'Invalid verification link.');
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new \Illuminate\Auth\Events\Verified($user));
        }

        return redirect('/app/dashboard?verified=1');
    })->middleware(['signed', 'throttle:6,1'])->name('verification.verify');

    // Google OAuth routes
    Route::get('/auth/google', function () {
        return \Laravel\Socialite\Facades\Socialite::driver('google')->redirect();
    })->name('auth.google');

    Route::get('/auth/google/callback', [\App\Http\Controllers\Api\AuthController::class, 'googleCallback']);

    // Public invoice view (share link)
    Route::get('/invoice/view/{token}', function ($token) {
        $invoice = \App\Models\Invoice::where('share_token', $token)
            ->where('share_expires_at', '>', now())
            ->firstOrFail();

        return view('pages.invoice-public', ['invoice' => $invoice->load('items', 'customer')]);
    })->name('invoice.public');

    // React SPA shell - all /app/* routes serve the same Blade view
    Route::get('/app/{any?}', function () {
        return view('layouts.app-shell');
    })->where('any', '.*')->middleware(['auth'])->name('app');
});
