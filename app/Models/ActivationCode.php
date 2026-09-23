<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivationCode extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'created_by', 'used_by', 'used_at', 'note'];

    protected $casts = ['used_at' => 'datetime'];

    /**
     * Characters used when generating a code.
     *
     * 0/O and 1/I/L are excluded: codes get read off a screen and typed by
     * hand, and those pairs are the ones people transcribe wrongly.
     */
    private const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    private const GROUPS = 3;
    private const GROUP_LENGTH = 4;

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'used_by');
    }

    public function scopeUnused(Builder $query): Builder
    {
        return $query->whereNull('used_by');
    }

    public function scopeUsed(Builder $query): Builder
    {
        return $query->whereNotNull('used_by');
    }

    public function isUsed(): bool
    {
        return $this->used_by !== null;
    }

    /**
     * Normalise user input: people paste codes with stray spaces, lowercase
     * them, or leave the dashes out entirely.
     */
    public static function normalise(string $code): string
    {
        $bare = preg_replace('/[^A-Z0-9]/', '', strtoupper(trim($code))) ?? '';

        return implode('-', str_split($bare, self::GROUP_LENGTH));
    }

    /**
     * Generate $count unique codes in one batch.
     *
     * Candidates are checked against both the codes already in the database and
     * the ones generated so far in this batch, so a batch can never contain a
     * duplicate. The unique index on `code` is the final backstop.
     */
    public static function generateBatch(int $count, int $createdBy, ?string $note = null): array
    {
        $codes = [];
        $attempts = 0;
        $maxAttempts = $count * 50;

        while (count($codes) < $count) {
            if (++$attempts > $maxAttempts) {
                throw new \RuntimeException('Unable to generate enough unique activation codes.');
            }

            $candidate = self::randomCode();

            if (in_array($candidate, $codes, true)) {
                continue;
            }

            if (self::where('code', $candidate)->exists()) {
                continue;
            }

            $codes[] = $candidate;
        }

        $now = now();
        self::insert(array_map(fn (string $code) => [
            'code' => $code,
            'created_by' => $createdBy,
            'note' => $note,
            'created_at' => $now,
            'updated_at' => $now,
        ], $codes));

        return $codes;
    }

    private static function randomCode(): string
    {
        $max = strlen(self::ALPHABET) - 1;
        $groups = [];

        for ($g = 0; $g < self::GROUPS; $g++) {
            $group = '';
            for ($i = 0; $i < self::GROUP_LENGTH; $i++) {
                // random_int is cryptographically secure; codes must not be guessable.
                $group .= self::ALPHABET[random_int(0, $max)];
            }
            $groups[] = $group;
        }

        return implode('-', $groups);
    }
}
