<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkspaceSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $settings = WorkspaceSettings::where('workspace_id', $request->user()->current_workspace_id)->first();

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'business_name' => 'nullable|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'trading_name' => 'nullable|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'tax_number' => 'nullable|string|max:100',
            'gst_number' => 'nullable|string|max:50',
            'vat_number' => 'nullable|string|max:50',
            'upi_id' => 'nullable|string|max:100',
            'bank_account_name' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_swift' => 'nullable|string|max:20',
            'bank_iban' => 'nullable|string|max:50',
            'payment_instructions' => 'nullable|string',
            'default_invoice_notes' => 'nullable|string',
            'default_terms' => 'nullable|string',
            'default_invoice_footer' => 'nullable|string',
            'invoice_prefix' => 'nullable|string|max:20',
            'invoice_number_digits' => 'nullable|integer|min:3|max:10',
            'invoice_include_year' => 'nullable|boolean',
            'default_payment_terms' => 'nullable|integer|min:0|max:365',
            'invoice_template' => 'nullable|string|in:clean,modern,compact',
            'accent_color' => 'nullable|string|max:7',
        ]);

        $settings = WorkspaceSettings::updateOrCreate(
            ['workspace_id' => $request->user()->current_workspace_id],
            $validated
        );

        return response()->json(['data' => $settings]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate(['logo' => 'required|image|max:2048']);

        $workspaceId = $request->user()->current_workspace_id;
        $path = $request->file('logo')->store("logos/{$workspaceId}", 'public');

        $settings = WorkspaceSettings::where('workspace_id', $workspaceId)->first();

        // Delete old logo
        if ($settings->logo_path && Storage::disk('public')->exists($settings->logo_path)) {
            Storage::disk('public')->delete($settings->logo_path);
        }

        $settings->update(['logo_path' => $path]);

        return response()->json(['data' => ['path' => $path, 'url' => Storage::url($path)]]);
    }

    public function uploadSignature(Request $request): JsonResponse
    {
        $request->validate(['signature' => 'required|image|max:1024']);

        $workspaceId = $request->user()->current_workspace_id;
        $path = $request->file('signature')->store("signatures/{$workspaceId}", 'public');

        WorkspaceSettings::where('workspace_id', $workspaceId)->update(['signature_path' => $path]);

        return response()->json(['data' => ['path' => $path, 'url' => Storage::url($path)]]);
    }

    public function uploadStamp(Request $request): JsonResponse
    {
        $request->validate(['stamp' => 'required|image|max:1024']);

        $workspaceId = $request->user()->current_workspace_id;
        $path = $request->file('stamp')->store("stamps/{$workspaceId}", 'public');

        WorkspaceSettings::where('workspace_id', $workspaceId)->update(['stamp_path' => $path]);

        return response()->json(['data' => ['path' => $path, 'url' => Storage::url($path)]]);
    }
}
