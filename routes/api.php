<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:3,60');
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::get('/google/redirect', [AuthController::class, 'googleRedirect']);
    Route::post('/google/callback', [AuthController::class, 'googleCallback']);
});

// Authenticated routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Workspaces
    Route::get('/workspaces', [WorkspaceController::class, 'index']);
    Route::post('/workspaces', [WorkspaceController::class, 'store']);
    Route::get('/workspaces/{workspace}', [WorkspaceController::class, 'show']);
    Route::put('/workspaces/{workspace}', [WorkspaceController::class, 'update']);
    Route::post('/workspaces/{workspace}/switch', [WorkspaceController::class, 'switch']);

    // Workspace-scoped routes
    Route::middleware(['workspace.member'])->group(function () {
        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Products
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        Route::post('/products/{product}/restore', [ProductController::class, 'restore']);
        Route::post('/products/{product}/duplicate', [ProductController::class, 'duplicate']);

        // Customers
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
        Route::put('/customers/{customer}', [CustomerController::class, 'update']);
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
        Route::get('/customers/{customer}/statement', [CustomerController::class, 'statement']);

        // Invoices
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf']);
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
        Route::put('/invoices/{invoice}', [InvoiceController::class, 'update']);
        Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy']);
        Route::post('/invoices/{invoice}/finalise', [InvoiceController::class, 'finalise']);
        Route::post('/invoices/{invoice}/send', [InvoiceController::class, 'send']);
        Route::post('/invoices/{invoice}/void', [InvoiceController::class, 'void']);
        Route::post('/invoices/{invoice}/record-payment', [InvoiceController::class, 'recordPayment']);
        Route::post('/invoices/{invoice}/share-link', [InvoiceController::class, 'generateShareLink']);

        // Services
        Route::get('/services', [\App\Http\Controllers\Api\ServiceController::class, 'index']);
        Route::post('/services', [\App\Http\Controllers\Api\ServiceController::class, 'store']);
        Route::get('/services/{service}', [\App\Http\Controllers\Api\ServiceController::class, 'show']);
        Route::put('/services/{service}', [\App\Http\Controllers\Api\ServiceController::class, 'update']);
        Route::delete('/services/{service}', [\App\Http\Controllers\Api\ServiceController::class, 'destroy']);

        // Suppliers
        Route::get('/suppliers', [\App\Http\Controllers\Api\SupplierController::class, 'index']);
        Route::post('/suppliers', [\App\Http\Controllers\Api\SupplierController::class, 'store']);
        Route::get('/suppliers/{supplier}', [\App\Http\Controllers\Api\SupplierController::class, 'show']);
        Route::put('/suppliers/{supplier}', [\App\Http\Controllers\Api\SupplierController::class, 'update']);
        Route::delete('/suppliers/{supplier}', [\App\Http\Controllers\Api\SupplierController::class, 'destroy']);

        // Quotes
        Route::get('/quotes', [\App\Http\Controllers\Api\QuoteController::class, 'index']);
        Route::post('/quotes', [\App\Http\Controllers\Api\QuoteController::class, 'store']);
        Route::get('/quotes/{quote}/pdf', [\App\Http\Controllers\Api\QuoteController::class, 'pdf']);
        Route::get('/quotes/{quote}', [\App\Http\Controllers\Api\QuoteController::class, 'show']);
        Route::put('/quotes/{quote}', [\App\Http\Controllers\Api\QuoteController::class, 'update']);
        Route::delete('/quotes/{quote}', [\App\Http\Controllers\Api\QuoteController::class, 'destroy']);
        Route::post('/quotes/{quote}/send', [\App\Http\Controllers\Api\QuoteController::class, 'send']);
        Route::post('/quotes/{quote}/accept', [\App\Http\Controllers\Api\QuoteController::class, 'accept']);
        Route::post('/quotes/{quote}/reject', [\App\Http\Controllers\Api\QuoteController::class, 'reject']);
        Route::post('/quotes/{quote}/convert', [\App\Http\Controllers\Api\QuoteController::class, 'convert']);

        // Bills
        Route::get('/bills', [\App\Http\Controllers\Api\BillController::class, 'index']);
        Route::post('/bills', [\App\Http\Controllers\Api\BillController::class, 'store']);
        Route::get('/bills/{bill}', [\App\Http\Controllers\Api\BillController::class, 'show']);
        Route::delete('/bills/{bill}', [\App\Http\Controllers\Api\BillController::class, 'destroy']);
        Route::post('/bills/{bill}/record-payment', [\App\Http\Controllers\Api\BillController::class, 'recordPayment']);

        // Payments
        Route::get('/payments', [\App\Http\Controllers\Api\PaymentController::class, 'index']);
        Route::post('/payments', [\App\Http\Controllers\Api\PaymentController::class, 'store']);
        Route::get('/payments/{payment}', [\App\Http\Controllers\Api\PaymentController::class, 'show']);
        Route::post('/payments/{payment}/allocate', [\App\Http\Controllers\Api\PaymentController::class, 'allocate']);

        // Transactions
        Route::get('/transactions', [\App\Http\Controllers\Api\TransactionController::class, 'index']);
        Route::post('/transactions', [\App\Http\Controllers\Api\TransactionController::class, 'store']);
        Route::get('/transactions/{transaction}', [\App\Http\Controllers\Api\TransactionController::class, 'show']);
        Route::put('/transactions/{transaction}', [\App\Http\Controllers\Api\TransactionController::class, 'update']);
        Route::delete('/transactions/{transaction}', [\App\Http\Controllers\Api\TransactionController::class, 'destroy']);
        Route::post('/transactions/transfer', [\App\Http\Controllers\Api\TransactionController::class, 'transfer']);

        // Tasks
        Route::get('/tasks', [\App\Http\Controllers\Api\TaskController::class, 'index']);
        Route::post('/tasks', [\App\Http\Controllers\Api\TaskController::class, 'store']);
        Route::get('/tasks/{task}', [\App\Http\Controllers\Api\TaskController::class, 'show']);
        Route::put('/tasks/{task}', [\App\Http\Controllers\Api\TaskController::class, 'update']);
        Route::delete('/tasks/{task}', [\App\Http\Controllers\Api\TaskController::class, 'destroy']);
        Route::post('/tasks/{task}/complete', [\App\Http\Controllers\Api\TaskController::class, 'complete']);

        // Commitments
        Route::get('/commitments', [\App\Http\Controllers\Api\CommitmentController::class, 'index']);
        Route::post('/commitments', [\App\Http\Controllers\Api\CommitmentController::class, 'store']);
        Route::get('/commitments/{commitment}', [\App\Http\Controllers\Api\CommitmentController::class, 'show']);
        Route::put('/commitments/{commitment}', [\App\Http\Controllers\Api\CommitmentController::class, 'update']);
        Route::delete('/commitments/{commitment}', [\App\Http\Controllers\Api\CommitmentController::class, 'destroy']);
        Route::post('/commitments/{commitment}/milestones', [\App\Http\Controllers\Api\CommitmentController::class, 'addMilestone']);

        // Categories
        Route::get('/categories', [\App\Http\Controllers\Api\CategoryController::class, 'index']);
        Route::post('/categories', [\App\Http\Controllers\Api\CategoryController::class, 'store']);
        Route::delete('/categories/{category}', [\App\Http\Controllers\Api\CategoryController::class, 'destroy']);

        // Accounts
        Route::get('/accounts', [\App\Http\Controllers\Api\AccountController::class, 'index']);
        Route::post('/accounts', [\App\Http\Controllers\Api\AccountController::class, 'store']);
        Route::put('/accounts/{account}', [\App\Http\Controllers\Api\AccountController::class, 'update']);
        Route::delete('/accounts/{account}', [\App\Http\Controllers\Api\AccountController::class, 'destroy']);

        // Leads
        Route::get('/leads/stats', [\App\Http\Controllers\Api\LeadController::class, 'stats']);
        Route::get('/leads', [\App\Http\Controllers\Api\LeadController::class, 'index']);
        Route::post('/leads', [\App\Http\Controllers\Api\LeadController::class, 'store']);
        Route::get('/leads/{lead}', [\App\Http\Controllers\Api\LeadController::class, 'show']);
        Route::put('/leads/{lead}', [\App\Http\Controllers\Api\LeadController::class, 'update']);
        Route::delete('/leads/{lead}', [\App\Http\Controllers\Api\LeadController::class, 'destroy']);
        Route::post('/leads/{lead}/convert', [\App\Http\Controllers\Api\LeadController::class, 'convert']);

        // Contacts
        Route::get('/contacts', [\App\Http\Controllers\Api\ContactController::class, 'index']);
        Route::post('/contacts', [\App\Http\Controllers\Api\ContactController::class, 'store']);
        Route::get('/contacts/{contact}', [\App\Http\Controllers\Api\ContactController::class, 'show']);
        Route::put('/contacts/{contact}', [\App\Http\Controllers\Api\ContactController::class, 'update']);
        Route::delete('/contacts/{contact}', [\App\Http\Controllers\Api\ContactController::class, 'destroy']);

        // Reports
        Route::get('/reports/{type}', [\App\Http\Controllers\Api\ReportController::class, 'show']);

        // Settings
        Route::get('/settings', [\App\Http\Controllers\Api\SettingsController::class, 'index']);
        Route::put('/settings', [\App\Http\Controllers\Api\SettingsController::class, 'update']);
        Route::post('/settings/logo', [\App\Http\Controllers\Api\SettingsController::class, 'uploadLogo']);
        Route::post('/settings/signature', [\App\Http\Controllers\Api\SettingsController::class, 'uploadSignature']);
        Route::post('/settings/stamp', [\App\Http\Controllers\Api\SettingsController::class, 'uploadStamp']);

        // Notifications
        Route::get('/notifications', function (Request $request) {
            return response()->json(['data' => $request->user()->notifications()->paginate(20)]);
        });
        Route::post('/notifications/{id}/read', function (Request $request, $id) {
            $request->user()->notifications()->where('id', $id)->update(['read_at' => now()]);
            return response()->json(['message' => 'Marked as read.']);
        });
    });
});
