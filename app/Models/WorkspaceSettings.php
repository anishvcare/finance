<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class WorkspaceSettings extends Model
{
    protected $fillable = [
        'workspace_id',
        'business_name',
        'legal_name',
        'trading_name',
        'owner_name',
        'email',
        'phone',
        'mobile',
        'website',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'postal_code',
        'country',
        'tax_number',
        'gst_number',
        'vat_number',
        'abn',
        'pan',
        'upi_id',
        'bank_account_name',
        'bank_name',
        'bank_bsb',
        'bank_account_number',
        'bank_swift',
        'bank_iban',
        'payment_instructions',
        'default_invoice_notes',
        'default_terms',
        'default_invoice_footer',
        'default_quote_footer',
        'invoice_prefix',
        'invoice_next_number',
        'invoice_number_digits',
        'invoice_include_year',
        'quote_prefix',
        'quote_next_number',
        'bill_prefix',
        'bill_next_number',
        'default_payment_terms',
        'default_tax_id',
        'logo_path',
        'signature_path',
        'stamp_path',
        'invoice_template',
        'accent_color',
    ];

    protected $casts = [
        'invoice_next_number' => 'integer',
        'invoice_number_digits' => 'integer',
        'invoice_include_year' => 'boolean',
        'quote_next_number' => 'integer',
        'bill_next_number' => 'integer',
        'default_payment_terms' => 'integer',
    ];

    protected $hidden = [
        'bank_account_number',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    protected function bankAccountNumber(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? decrypt($value) : null,
            set: fn (?string $value) => $value ? encrypt($value) : null,
        );
    }
}
