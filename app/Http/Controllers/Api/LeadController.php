<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Lead::query()
            ->when($request->search, function ($q, $s) {
                $q->where(function ($qq) use ($s) {
                    foreach (['name', 'company', 'email', 'mobile', 'phone', 'website'] as $col) {
                        $qq->orWhere($col, 'like', "%{$s}%");
                    }
                });
            })
            ->when($request->category, fn ($q, $c) => $q->where('category', $c))
            ->when($request->channel, fn ($q, $c) => $q->where('channel', $c))
            ->when($request->stage, fn ($q, $st) => $q->where('stage', $st))
            ->when($request->priority, fn ($q, $p) => $q->where('priority', $p))
            ->when($request->contact, function ($q, $contact) {
                match ($contact) {
                    'has_email' => $q->whereNotNull('email')->where('email', '!=', ''),
                    'has_mobile' => $q->whereNotNull('mobile')->where('mobile', '!=', ''),
                    'has_phone' => $q->whereNotNull('phone')->where('phone', '!=', ''),
                    'no_contact' => $q->whereNull('email')->whereNull('mobile')->whereNull('phone'),
                    default => null,
                };
            })
            ->when($request->followup, function ($q, $f) {
                match ($f) {
                    'today' => $q->whereDate('next_follow_up_date', today()),
                    'overdue' => $q->whereNotNull('next_follow_up_date')->whereDate('next_follow_up_date', '<', today())->whereNotIn('stage', ['won', 'lost']),
                    'upcoming' => $q->whereDate('next_follow_up_date', '>', today()),
                    'none' => $q->whereNull('next_follow_up_date'),
                    default => null,
                };
            })
            ->orderByRaw("FIELD(priority,'urgent','high','medium','low')")
            ->orderByRaw('next_follow_up_date IS NULL, next_follow_up_date ASC')
            ->orderByDesc('id');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function stats(Request $request): JsonResponse
    {
        $base = fn () => Lead::query();

        $openStages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];

        return response()->json([
            'total' => $base()->count(),
            'today' => $base()->whereDate('next_follow_up_date', today())->whereNotIn('stage', ['won', 'lost'])->count(),
            'overdue' => $base()->whereNotNull('next_follow_up_date')->whereDate('next_follow_up_date', '<', today())->whereNotIn('stage', ['won', 'lost'])->count(),
            'upcoming' => $base()->whereDate('next_follow_up_date', '>', today())->whereNotIn('stage', ['won', 'lost'])->count(),
            'urgent' => $base()->where('priority', 'urgent')->whereNotIn('stage', ['won', 'lost'])->count(),
            'open' => $base()->whereIn('stage', $openStages)->count(),
            'won' => $base()->where('stage', 'won')->count(),
            'by_stage' => $base()->selectRaw('stage, COUNT(*) as count')->groupBy('stage')->pluck('count', 'stage'),
            'categories' => $base()->whereNotNull('category')->where('category', '!=', '')->distinct()->orderBy('category')->pluck('category'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateLead($request);
        $validated['created_by'] = $request->user()->id;
        $lead = Lead::create($validated);

        return response()->json(['data' => $lead], 201);
    }

    public function show(Lead $lead): JsonResponse
    {
        return response()->json(['data' => $lead->load('customer:id,name', 'assignee:id,name')]);
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
        $validated = $this->validateLead($request, true);
        $lead->update($validated);

        return response()->json(['data' => $lead->fresh()]);
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();
        return response()->json(null, 204);
    }

    public function convert(Request $request, Lead $lead): JsonResponse
    {
        if ($lead->converted_customer_id && ($customer = Customer::find($lead->converted_customer_id))) {
            return response()->json(['data' => $customer, 'message' => 'Lead already converted.']);
        }

        $customer = Customer::create([
            'type' => $lead->company ? 'business' : 'individual',
            'name' => $lead->name,
            'business_name' => $lead->company,
            'email' => $lead->email,
            'mobile' => $lead->mobile,
            'phone' => $lead->phone,
            'billing_city' => $lead->city,
            'billing_state' => $lead->state,
            'billing_country' => $lead->country,
            'currency' => $lead->currency,
            'notes' => $lead->notes,
        ]);

        $lead->update(['converted_customer_id' => $customer->id, 'stage' => 'won']);

        return response()->json(['data' => $customer, 'message' => 'Lead converted to customer.'], 201);
    }

    private function validateLead(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => "{$req}|string|max:255",
            'company' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'mobile' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:50',
            'website' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'channel' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
            'stage' => 'nullable|in:new,contacted,qualified,proposal,negotiation,won,lost',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'estimated_value' => 'nullable|integer|min:0',
            'currency' => 'nullable|string|size:3',
            'next_follow_up_date' => 'nullable|date',
            'last_contacted_at' => 'nullable|date',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);
    }
}
