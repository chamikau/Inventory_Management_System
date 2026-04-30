<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('borrowings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->string('borrower_name');
            $table->string('contact_details');
            $table->integer('quantity_borrowed');
            $table->date('borrow_date');
            $table->date('expected_return_date');
            $table->date('actual_return_date')->nullable();
            $table->enum('status', ['borrowed', 'returned'])->default('borrowed');
            $table->foreignId('borrowed_by')->constrained('users');
            $table->foreignId('returned_by')->nullable()->constrained('users');
            $table->timestamps();
            
            $table->index('status');
            $table->index('borrow_date');
            $table->index('expected_return_date');
            $table->index('borrower_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('borrowings');
    }
};