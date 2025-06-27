<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('messages')->onDelete('cascade');
            $table->string('name'); // Name of the file
            $table->string('path'); // Path to the file
            $table->string('mime'); // Path to the file
            $table->string('type'); // Type of the file (e.g., image, video, document)
            $table->string('size'); // Size of the file
            $table->string('status')->default('uploaded'); // Status of the attachment (e.g., uploaded, processing, failed)
            $table->boolean('is_deleted')->default(false); // Indicates if the attachment is deleted
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->onDelete('cascade'); // User ID of the uploader
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_attachments');
    }
};
