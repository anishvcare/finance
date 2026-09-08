# LifeLedger Pro - Database Schema

## Entity Relationship Overview

This document defines all database tables, their fields, relationships, and indexes.

## Core Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| name | VARCHAR(255) | |
| email | VARCHAR(255) | Unique |
| email_verified_at | TIMESTAMP | Nullable |
| password | VARCHAR(255) | Nullable (Google users) |
| google_id | VARCHAR(255) | Nullable, indexed |
| avatar | VARCHAR(500) | Nullable |
| is_super_admin | BOOLEAN | Default false |
| is_active | BOOLEAN | Default true |
| onboarding_completed | BOOLEAN | Default false |
| timezone | VARCHAR(50) | Default 'UTC' |
| date_format | VARCHAR(20) | Default 'Y-m-d' |
| last_login_at | TIMESTAMP | Nullable |
| remember_token | VARCHAR(100) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |


### workspaces
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| uuid | CHAR(36) | Unique, public identifier |
| name | VARCHAR(255) | |
| type | ENUM('personal','business') | |
| owner_id | BIGINT UNSIGNED | FK → users |
| currency | VARCHAR(3) | Default 'USD' |
| timezone | VARCHAR(50) | |
| financial_year_start | TINYINT | Month (1-12) |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

### workspace_members (pivot)
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| user_id | BIGINT UNSIGNED | FK → users |
| role | ENUM('owner','administrator','accountant','manager','staff','viewer') | |
| invited_at | TIMESTAMP | Nullable |
| accepted_at | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| **UNIQUE** | (workspace_id, user_id) | |


### workspace_settings
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces, unique |
| business_name | VARCHAR(255) | Nullable |
| legal_name | VARCHAR(255) | Nullable |
| trading_name | VARCHAR(255) | Nullable |
| owner_name | VARCHAR(255) | Nullable |
| email | VARCHAR(255) | Nullable |
| phone | VARCHAR(50) | Nullable |
| mobile | VARCHAR(50) | Nullable |
| website | VARCHAR(255) | Nullable |
| address_line_1 | VARCHAR(255) | Nullable |
| address_line_2 | VARCHAR(255) | Nullable |
| city | VARCHAR(100) | Nullable |
| state | VARCHAR(100) | Nullable |
| postal_code | VARCHAR(20) | Nullable |
| country | VARCHAR(100) | Nullable |
| tax_number | VARCHAR(100) | Nullable |
| gst_number | VARCHAR(50) | Nullable |
| vat_number | VARCHAR(50) | Nullable |
| abn | VARCHAR(20) | Nullable |
| pan | VARCHAR(20) | Nullable |
| upi_id | VARCHAR(100) | Nullable |
| bank_account_name | VARCHAR(255) | Nullable |
| bank_name | VARCHAR(255) | Nullable |
| bank_bsb | VARCHAR(20) | Nullable |
| bank_account_number | VARCHAR(50) | Nullable (encrypted) |
| bank_swift | VARCHAR(20) | Nullable |
| bank_iban | VARCHAR(50) | Nullable |
| payment_instructions | TEXT | Nullable |
| default_invoice_notes | TEXT | Nullable |
| default_terms | TEXT | Nullable |
| default_invoice_footer | TEXT | Nullable |
| default_quote_footer | TEXT | Nullable |
| invoice_prefix | VARCHAR(20) | Default 'INV-' |
| invoice_next_number | INT UNSIGNED | Default 1 |
| invoice_number_digits | TINYINT | Default 5 |
| invoice_include_year | BOOLEAN | Default false |
| quote_prefix | VARCHAR(20) | Default 'QT-' |
| quote_next_number | INT UNSIGNED | Default 1 |
| bill_prefix | VARCHAR(20) | Default 'BILL-' |
| bill_next_number | INT UNSIGNED | Default 1 |
| default_payment_terms | SMALLINT | Days, default 30 |
| default_tax_id | BIGINT UNSIGNED | Nullable, FK → taxes |
| logo_path | VARCHAR(500) | Nullable |
| signature_path | VARCHAR(500) | Nullable |
| stamp_path | VARCHAR(500) | Nullable |
| invoice_template | VARCHAR(50) | Default 'clean' |
| accent_color | VARCHAR(7) | Default '#2563EB' |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |


## Financial Tables

### accounts
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| name | VARCHAR(255) | |
| type | ENUM('bank','cash','credit_card','wallet','other') | |
| currency | VARCHAR(3) | |
| opening_balance | BIGINT | Minor units (cents) |
| current_balance | BIGINT | Minor units |
| is_default | BOOLEAN | Default false |
| is_active | BOOLEAN | Default true |
| color | VARCHAR(7) | Nullable |
| icon | VARCHAR(50) | Nullable |
| notes | TEXT | Nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

### categories
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| name | VARCHAR(255) | |
| type | ENUM('income','expense','product','service') | |
| parent_id | BIGINT UNSIGNED | Nullable, self-ref |
| color | VARCHAR(7) | Nullable |
| icon | VARCHAR(50) | Nullable |
| is_system | BOOLEAN | Default false |
| sort_order | INT | Default 0 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### transactions
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| uuid | CHAR(36) | Unique (for offline sync) |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| account_id | BIGINT UNSIGNED | FK → accounts |
| type | ENUM('income','expense','transfer','refund','adjustment') | |
| amount | BIGINT | Minor units |
| currency | VARCHAR(3) | |
| date | DATE | |
| time | TIME | Nullable |
| category_id | BIGINT UNSIGNED | Nullable, FK → categories |
| customer_id | BIGINT UNSIGNED | Nullable, FK → customers |
| supplier_id | BIGINT UNSIGNED | Nullable, FK → suppliers |
| invoice_id | BIGINT UNSIGNED | Nullable, FK → invoices |
| bill_id | BIGINT UNSIGNED | Nullable, FK → bills |
| payment_id | BIGINT UNSIGNED | Nullable, FK → payments |
| description | VARCHAR(500) | Nullable |
| notes | TEXT | Nullable |
| payment_method | VARCHAR(50) | Nullable |
| reference | VARCHAR(255) | Nullable |
| tags | JSON | Nullable |
| is_recurring | BOOLEAN | Default false |
| recurrence_rule | VARCHAR(100) | Nullable |
| ocr_import_id | BIGINT UNSIGNED | Nullable |
| ocr_confidence | DECIMAL(5,2) | Nullable |
| review_status | ENUM('pending','reviewed','confirmed') | Default 'confirmed' |
| transfer_pair_id | BIGINT UNSIGNED | Nullable, self-ref for transfers |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |


### taxes
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| name | VARCHAR(100) | e.g. 'GST', 'VAT' |
| code | VARCHAR(20) | e.g. 'GST10' |
| rate | DECIMAL(8,4) | Percentage |
| type | ENUM('inclusive','exclusive') | |
| is_compound | BOOLEAN | Default false |
| is_active | BOOLEAN | Default true |
| description | VARCHAR(255) | Nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## Product & Service Tables

### products
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| name | VARCHAR(255) | |
| code | VARCHAR(100) | Nullable |
| sku | VARCHAR(100) | Nullable |
| barcode | VARCHAR(100) | Nullable |
| description | TEXT | Nullable |
| category_id | BIGINT UNSIGNED | Nullable, FK → categories |
| unit | VARCHAR(50) | Default 'each' |
| sales_price | BIGINT | Minor units |
| purchase_price | BIGINT | Nullable, minor units |
| cost_price | BIGINT | Nullable, minor units |
| wholesale_price | BIGINT | Nullable, minor units |
| tax_id | BIGINT UNSIGNED | Nullable, FK → taxes |
| tax_inclusive | BOOLEAN | Default false |
| currency | VARCHAR(3) | |
| track_inventory | BOOLEAN | Default false |
| opening_stock | DECIMAL(12,3) | Default 0 |
| current_stock | DECIMAL(12,3) | Default 0 |
| low_stock_level | DECIMAL(12,3) | Nullable |
| image_path | VARCHAR(500) | Nullable |
| is_active | BOOLEAN | Default true |
| notes | TEXT | Nullable |
| supplier_id | BIGINT UNSIGNED | Nullable, FK → suppliers |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

### product_prices (price history)
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| product_id | BIGINT UNSIGNED | FK → products |
| price_type | ENUM('sales','purchase','cost','wholesale','promotional') | |
| amount | BIGINT | Minor units |
| effective_from | DATE | |
| effective_to | DATE | Nullable |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |

### services
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| name | VARCHAR(255) | |
| code | VARCHAR(100) | Nullable |
| description | TEXT | Nullable |
| category_id | BIGINT UNSIGNED | Nullable, FK → categories |
| unit | VARCHAR(50) | Default 'hour' |
| hourly_rate | BIGINT | Nullable, minor units |
| fixed_price | BIGINT | Nullable, minor units |
| minimum_charge | BIGINT | Nullable, minor units |
| default_quantity | DECIMAL(12,3) | Default 1 |
| tax_id | BIGINT UNSIGNED | Nullable, FK → taxes |
| tax_inclusive | BOOLEAN | Default false |
| currency | VARCHAR(3) | |
| estimated_duration | VARCHAR(100) | Nullable |
| internal_cost | BIGINT | Nullable, minor units |
| is_active | BOOLEAN | Default true |
| notes | TEXT | Nullable |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |


## Customer & Supplier Tables

### customers
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| type | ENUM('individual','business','organisation') | |
| name | VARCHAR(255) | |
| business_name | VARCHAR(255) | Nullable |
| contact_person | VARCHAR(255) | Nullable |
| email | VARCHAR(255) | Nullable |
| phone | VARCHAR(50) | Nullable |
| mobile | VARCHAR(50) | Nullable |
| billing_address_line_1 | VARCHAR(255) | Nullable |
| billing_address_line_2 | VARCHAR(255) | Nullable |
| billing_city | VARCHAR(100) | Nullable |
| billing_state | VARCHAR(100) | Nullable |
| billing_postal_code | VARCHAR(20) | Nullable |
| billing_country | VARCHAR(100) | Nullable |
| shipping_address_line_1 | VARCHAR(255) | Nullable |
| shipping_address_line_2 | VARCHAR(255) | Nullable |
| shipping_city | VARCHAR(100) | Nullable |
| shipping_state | VARCHAR(100) | Nullable |
| shipping_postal_code | VARCHAR(20) | Nullable |
| shipping_country | VARCHAR(100) | Nullable |
| tax_number | VARCHAR(100) | Nullable |
| currency | VARCHAR(3) | Nullable |
| payment_terms | SMALLINT | Days, nullable |
| credit_limit | BIGINT | Nullable, minor units |
| default_discount | DECIMAL(5,2) | Nullable |
| default_tax_id | BIGINT UNSIGNED | Nullable, FK → taxes |
| opening_balance | BIGINT | Default 0, minor units |
| notes | TEXT | Nullable |
| tags | JSON | Nullable |
| is_active | BOOLEAN | Default true |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

### suppliers
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| name | VARCHAR(255) | |
| business_name | VARCHAR(255) | Nullable |
| contact_person | VARCHAR(255) | Nullable |
| email | VARCHAR(255) | Nullable |
| phone | VARCHAR(50) | Nullable |
| mobile | VARCHAR(50) | Nullable |
| address_line_1 | VARCHAR(255) | Nullable |
| address_line_2 | VARCHAR(255) | Nullable |
| city | VARCHAR(100) | Nullable |
| state | VARCHAR(100) | Nullable |
| postal_code | VARCHAR(20) | Nullable |
| country | VARCHAR(100) | Nullable |
| tax_number | VARCHAR(100) | Nullable |
| currency | VARCHAR(3) | Nullable |
| payment_terms | SMALLINT | Nullable |
| bank_account_name | VARCHAR(255) | Nullable |
| bank_name | VARCHAR(255) | Nullable |
| bank_account_number | VARCHAR(50) | Nullable (encrypted) |
| bank_bsb | VARCHAR(20) | Nullable |
| bank_swift | VARCHAR(20) | Nullable |
| bank_iban | VARCHAR(50) | Nullable |
| opening_balance | BIGINT | Default 0, minor units |
| notes | TEXT | Nullable |
| tags | JSON | Nullable |
| is_active | BOOLEAN | Default true |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

### contacts
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| name | VARCHAR(255) | |
| email | VARCHAR(255) | Nullable |
| phone | VARCHAR(50) | Nullable |
| mobile | VARCHAR(50) | Nullable |
| organisation | VARCHAR(255) | Nullable |
| role | VARCHAR(100) | Nullable |
| notes | TEXT | Nullable |
| tags | JSON | Nullable |
| customer_id | BIGINT UNSIGNED | Nullable, FK → customers |
| supplier_id | BIGINT UNSIGNED | Nullable, FK → suppliers |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |


## Document Tables

### quotes
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| quote_number | VARCHAR(50) | Unique per workspace |
| customer_id | BIGINT UNSIGNED | FK → customers |
| status | ENUM('draft','sent','viewed','accepted','rejected','expired','converted','cancelled') | |
| quote_date | DATE | |
| expiry_date | DATE | Nullable |
| currency | VARCHAR(3) | |
| subtotal | BIGINT | Minor units |
| discount_amount | BIGINT | Default 0 |
| shipping_amount | BIGINT | Default 0 |
| tax_amount | BIGINT | Default 0 |
| additional_charges | BIGINT | Default 0 |
| round_off | BIGINT | Default 0 |
| total | BIGINT | Minor units |
| notes | TEXT | Nullable |
| terms | TEXT | Nullable |
| customer_message | TEXT | Nullable |
| internal_notes | TEXT | Nullable |
| converted_invoice_id | BIGINT UNSIGNED | Nullable, FK → invoices |
| template | VARCHAR(50) | Default 'clean' |
| created_by | BIGINT UNSIGNED | FK → users |
| sent_at | TIMESTAMP | Nullable |
| viewed_at | TIMESTAMP | Nullable |
| accepted_at | TIMESTAMP | Nullable |
| rejected_at | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

### quote_items
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| quote_id | BIGINT UNSIGNED | FK → quotes |
| type | ENUM('product','service','custom') | |
| product_id | BIGINT UNSIGNED | Nullable, FK → products |
| service_id | BIGINT UNSIGNED | Nullable, FK → services |
| name | VARCHAR(255) | Snapshot |
| description | TEXT | Nullable, snapshot |
| unit | VARCHAR(50) | |
| quantity | DECIMAL(12,3) | |
| unit_price | BIGINT | Minor units, snapshot |
| discount_rate | DECIMAL(5,2) | Default 0 |
| discount_amount | BIGINT | Default 0 |
| tax_id | BIGINT UNSIGNED | Nullable |
| tax_rate | DECIMAL(8,4) | Default 0 |
| tax_amount | BIGINT | Default 0 |
| line_total | BIGINT | Minor units |
| sort_order | INT | Default 0 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### invoices
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| invoice_number | VARCHAR(50) | Unique per workspace |
| customer_id | BIGINT UNSIGNED | FK → customers |
| quote_id | BIGINT UNSIGNED | Nullable, FK → quotes |
| status | ENUM('draft','finalised','sent','viewed','partially_paid','paid','overdue','void','cancelled','refunded') | |
| invoice_date | DATE | |
| due_date | DATE | |
| currency | VARCHAR(3) | |
| payment_terms | SMALLINT | Days |
| reference_number | VARCHAR(100) | Nullable |
| purchase_order | VARCHAR(100) | Nullable |
| salesperson | VARCHAR(100) | Nullable |
| subtotal | BIGINT | Minor units |
| discount_amount | BIGINT | Default 0 |
| shipping_amount | BIGINT | Default 0 |
| tax_amount | BIGINT | Default 0 |
| additional_charges | BIGINT | Default 0 |
| round_off | BIGINT | Default 0 |
| total | BIGINT | Minor units |
| amount_paid | BIGINT | Default 0 |
| balance_due | BIGINT | Minor units |
| notes | TEXT | Nullable |
| terms | TEXT | Nullable |
| payment_instructions | TEXT | Nullable |
| internal_notes | TEXT | Nullable |
| footer | TEXT | Nullable |
| template | VARCHAR(50) | Default 'clean' |
| share_token | VARCHAR(64) | Nullable, unique |
| share_expires_at | TIMESTAMP | Nullable |
| finalised_at | TIMESTAMP | Nullable |
| sent_at | TIMESTAMP | Nullable |
| viewed_at | TIMESTAMP | Nullable |
| paid_at | TIMESTAMP | Nullable |
| voided_at | TIMESTAMP | Nullable |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |


### invoice_items
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| invoice_id | BIGINT UNSIGNED | FK → invoices |
| type | ENUM('product','service','custom') | |
| product_id | BIGINT UNSIGNED | Nullable |
| service_id | BIGINT UNSIGNED | Nullable |
| name | VARCHAR(255) | Snapshot of item name |
| description | TEXT | Nullable, snapshot |
| unit | VARCHAR(50) | |
| quantity | DECIMAL(12,3) | |
| unit_price | BIGINT | Minor units, snapshot |
| discount_rate | DECIMAL(5,2) | Default 0 |
| discount_amount | BIGINT | Default 0 |
| tax_id | BIGINT UNSIGNED | Nullable |
| tax_rate | DECIMAL(8,4) | Default 0 |
| tax_amount | BIGINT | Default 0 |
| line_total | BIGINT | Minor units |
| sort_order | INT | Default 0 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### bills
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| bill_number | VARCHAR(50) | Unique per workspace |
| supplier_id | BIGINT UNSIGNED | FK → suppliers |
| supplier_invoice_number | VARCHAR(100) | Nullable |
| status | ENUM('draft','open','partially_paid','paid','overdue','cancelled','disputed') | |
| bill_date | DATE | |
| due_date | DATE | |
| currency | VARCHAR(3) | |
| payment_terms | SMALLINT | |
| subtotal | BIGINT | Minor units |
| discount_amount | BIGINT | Default 0 |
| shipping_amount | BIGINT | Default 0 |
| tax_amount | BIGINT | Default 0 |
| additional_charges | BIGINT | Default 0 |
| round_off | BIGINT | Default 0 |
| total | BIGINT | Minor units |
| amount_paid | BIGINT | Default 0 |
| balance_due | BIGINT | Minor units |
| notes | TEXT | Nullable |
| internal_notes | TEXT | Nullable |
| attachment_path | VARCHAR(500) | Nullable |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

### bill_items
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| bill_id | BIGINT UNSIGNED | FK → bills |
| type | ENUM('product','service','expense') | |
| product_id | BIGINT UNSIGNED | Nullable |
| service_id | BIGINT UNSIGNED | Nullable |
| name | VARCHAR(255) | |
| description | TEXT | Nullable |
| unit | VARCHAR(50) | |
| quantity | DECIMAL(12,3) | |
| unit_price | BIGINT | Minor units |
| discount_rate | DECIMAL(5,2) | Default 0 |
| discount_amount | BIGINT | Default 0 |
| tax_id | BIGINT UNSIGNED | Nullable |
| tax_rate | DECIMAL(8,4) | Default 0 |
| tax_amount | BIGINT | Default 0 |
| line_total | BIGINT | Minor units |
| sort_order | INT | Default 0 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### payments
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| type | ENUM('incoming','outgoing') | |
| customer_id | BIGINT UNSIGNED | Nullable, FK → customers |
| supplier_id | BIGINT UNSIGNED | Nullable, FK → suppliers |
| account_id | BIGINT UNSIGNED | FK → accounts |
| amount | BIGINT | Minor units |
| currency | VARCHAR(3) | |
| exchange_rate | DECIMAL(12,6) | Default 1.000000 |
| payment_date | DATE | |
| payment_method | VARCHAR(50) | |
| reference_number | VARCHAR(255) | Nullable |
| notes | TEXT | Nullable |
| attachment_path | VARCHAR(500) | Nullable |
| is_refund | BOOLEAN | Default false |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

### payment_allocations
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| payment_id | BIGINT UNSIGNED | FK → payments |
| invoice_id | BIGINT UNSIGNED | Nullable, FK → invoices |
| bill_id | BIGINT UNSIGNED | Nullable, FK → bills |
| amount | BIGINT | Minor units allocated |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |


## Task & Commitment Tables

### tasks
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| title | VARCHAR(255) | |
| description | TEXT | Nullable |
| status | ENUM('pending','in_progress','completed','cancelled') | |
| priority | ENUM('low','medium','high','urgent') | Default 'medium' |
| due_date | DATE | Nullable |
| due_time | TIME | Nullable |
| completed_at | TIMESTAMP | Nullable |
| parent_id | BIGINT UNSIGNED | Nullable, self-ref for subtasks |
| assignee_id | BIGINT UNSIGNED | Nullable, FK → users |
| customer_id | BIGINT UNSIGNED | Nullable |
| supplier_id | BIGINT UNSIGNED | Nullable |
| invoice_id | BIGINT UNSIGNED | Nullable |
| bill_id | BIGINT UNSIGNED | Nullable |
| commitment_id | BIGINT UNSIGNED | Nullable |
| is_recurring | BOOLEAN | Default false |
| recurrence_rule | VARCHAR(100) | Nullable |
| tags | JSON | Nullable |
| sort_order | INT | Default 0 |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

### commitments
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| title | VARCHAR(255) | |
| description | TEXT | Nullable |
| type | VARCHAR(50) | e.g. 'payment','delivery','renewal','submission' |
| status | ENUM('pending','in_progress','completed','overdue','cancelled') | |
| priority | ENUM('low','medium','high','urgent') | Default 'medium' |
| start_date | DATE | Nullable |
| due_date | DATE | |
| completed_at | TIMESTAMP | Nullable |
| progress_percentage | TINYINT UNSIGNED | Default 0 |
| customer_id | BIGINT UNSIGNED | Nullable |
| supplier_id | BIGINT UNSIGNED | Nullable |
| invoice_id | BIGINT UNSIGNED | Nullable |
| bill_id | BIGINT UNSIGNED | Nullable |
| contact_id | BIGINT UNSIGNED | Nullable |
| amount | BIGINT | Nullable, minor units |
| currency | VARCHAR(3) | Nullable |
| notes | TEXT | Nullable |
| tags | JSON | Nullable |
| created_by | BIGINT UNSIGNED | FK → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

### commitment_milestones
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| commitment_id | BIGINT UNSIGNED | FK → commitments |
| title | VARCHAR(255) | |
| description | TEXT | Nullable |
| due_date | DATE | Nullable |
| completed_at | TIMESTAMP | Nullable |
| sort_order | INT | Default 0 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### reminders
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| user_id | BIGINT UNSIGNED | FK → users |
| remindable_type | VARCHAR(255) | Polymorphic |
| remindable_id | BIGINT UNSIGNED | Polymorphic |
| channel | ENUM('in_app','email','push') | |
| remind_at | TIMESTAMP | |
| message | VARCHAR(500) | Nullable |
| is_sent | BOOLEAN | Default false |
| sent_at | TIMESTAMP | Nullable |
| is_recurring | BOOLEAN | Default false |
| recurrence_rule | VARCHAR(100) | Nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |


## System Tables

### activity_logs
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | Nullable |
| user_id | BIGINT UNSIGNED | Nullable |
| subject_type | VARCHAR(255) | Polymorphic |
| subject_id | BIGINT UNSIGNED | Polymorphic |
| action | VARCHAR(50) | e.g. 'created','updated','deleted','finalised' |
| description | VARCHAR(500) | |
| properties | JSON | Nullable, changed fields |
| ip_address | VARCHAR(45) | Nullable |
| user_agent | VARCHAR(500) | Nullable |
| created_at | TIMESTAMP | |

### ocr_imports
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| user_id | BIGINT UNSIGNED | FK → users |
| source_app | VARCHAR(50) | Nullable (googlepay, phonepe, etc.) |
| raw_text | TEXT | Nullable |
| extracted_amount | BIGINT | Nullable, minor units |
| extracted_currency | VARCHAR(3) | Nullable |
| extracted_date | DATE | Nullable |
| extracted_time | TIME | Nullable |
| extracted_merchant | VARCHAR(255) | Nullable |
| extracted_reference | VARCHAR(255) | Nullable |
| extracted_status | VARCHAR(50) | Nullable |
| confidence_score | DECIMAL(5,2) | Nullable |
| transaction_id | BIGINT UNSIGNED | Nullable, FK → transactions |
| payment_id | BIGINT UNSIGNED | Nullable, FK → payments |
| image_retained | BOOLEAN | Default false |
| image_path | VARCHAR(500) | Nullable |
| status | ENUM('pending','linked','discarded') | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### email_logs
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| to_email | VARCHAR(255) | |
| to_name | VARCHAR(255) | Nullable |
| subject | VARCHAR(255) | |
| type | VARCHAR(50) | e.g. 'invoice','quote','reminder' |
| related_type | VARCHAR(255) | Nullable, polymorphic |
| related_id | BIGINT UNSIGNED | Nullable |
| status | ENUM('queued','sent','failed') | |
| error_message | TEXT | Nullable |
| sent_at | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | |

### document_sequences
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| type | ENUM('invoice','quote','bill','receipt') | |
| prefix | VARCHAR(20) | |
| next_number | INT UNSIGNED | |
| min_digits | TINYINT | Default 5 |
| include_year | BOOLEAN | Default false |
| reset_yearly | BOOLEAN | Default false |
| financial_year_start | TINYINT | Month |
| last_reset_year | SMALLINT UNSIGNED | Nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| **UNIQUE** | (workspace_id, type) | |

### plans
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| name | VARCHAR(100) | |
| slug | VARCHAR(100) | Unique |
| description | TEXT | Nullable |
| price_monthly | BIGINT | Minor units |
| price_yearly | BIGINT | Minor units |
| currency | VARCHAR(3) | |
| max_workspaces | INT | -1 = unlimited |
| max_members | INT | Per workspace |
| max_products | INT | |
| max_services | INT | |
| max_customers | INT | |
| max_invoices_monthly | INT | |
| max_bills_monthly | INT | |
| max_transactions_monthly | INT | |
| max_ocr_monthly | INT | |
| max_storage_mb | INT | |
| features | JSON | Feature flags |
| is_active | BOOLEAN | Default true |
| sort_order | INT | Default 0 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### subscriptions
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| workspace_id | BIGINT UNSIGNED | FK → workspaces |
| plan_id | BIGINT UNSIGNED | FK → plans |
| status | ENUM('active','cancelled','expired','trial') | |
| started_at | TIMESTAMP | |
| expires_at | TIMESTAMP | Nullable |
| cancelled_at | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### settings (application-wide)
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED | Primary key |
| key | VARCHAR(100) | Unique |
| value | TEXT | Nullable |
| type | VARCHAR(20) | string, integer, boolean, json |
| group | VARCHAR(50) | e.g. 'app','mail','pwa','oauth' |
| is_encrypted | BOOLEAN | Default false |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## Indexes Strategy

All workspace-scoped tables have:
- INDEX on `workspace_id`
- Composite indexes where appropriate: `(workspace_id, status)`, `(workspace_id, customer_id)`, etc.

Financial document tables have:
- UNIQUE on `(workspace_id, invoice_number)` / `(workspace_id, quote_number)` / `(workspace_id, bill_number)`
- INDEX on `status`
- INDEX on `due_date`
- INDEX on `customer_id` / `supplier_id`

Transactions table has:
- INDEX on `(workspace_id, date)`
- INDEX on `(workspace_id, type)`
- INDEX on `(workspace_id, account_id)`
- INDEX on `uuid`
