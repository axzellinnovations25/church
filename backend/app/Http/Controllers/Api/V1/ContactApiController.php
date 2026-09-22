<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactMessageRequest;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;

class ContactApiController extends Controller
{
    /**
     * --------------------------------------------------------------------------
     * POST /api/v1/contact
     * --------------------------------------------------------------------------
     * Store a contact message submitted from the public website.
     */

    public function store(ContactMessageRequest $request): JsonResponse
    {
        $validated = $request->validated();

        ContactMessage::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'subject' => $validated['subject'],
            'category' => $validated['category'],
            'status' => 'new',
            'group_id' => $validated['group_id'] ?? null,
            'message' => $validated['message'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully'
        ]);
    }
}
