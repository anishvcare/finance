<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        /*
         * This app is an SPA that calls its own API using session cookies
         * (Sanctum stateful mode). Sanctum only starts a session for requests
         * that look like they came from the frontend — it matches the
         * Origin/Referer header against config('sanctum.stateful').
         *
         * A browser always sends Origin; the test client does not. Without it,
         * any endpoint touching the session (login, logout, register) fails
         * with "Session store not set on request." Sending it makes test
         * requests an accurate simulation of how the SPA actually calls the API.
         */
        $this->withHeader('Origin', config('app.url'));
    }
}
