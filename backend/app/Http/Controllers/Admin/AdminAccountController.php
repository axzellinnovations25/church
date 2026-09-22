<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\Rule;

class AdminAccountController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email:rfc', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', $this->passwordRule()],
            'group_id' => ['nullable', 'integer', 'exists:groups,id'],
        ]);

        if (! empty($validated['group_id'])) {
            User::where('group_id', $validated['group_id'])
                ->where('is_main_admin', false)
                ->update(['group_id' => null]);
        }

        $adminAccount = User::create([
            'name' => $this->titleCase($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'is_main_admin' => false,
            'group_id' => $validated['group_id'] ?? null,
        ]);

        Audit::log($request, 'created admin account', $adminAccount, $adminAccount->name);

        return response()->json([
            'message' => 'Admin account registered successfully.',
        ], 201);
    }

    public function update(Request $request, User $adminAccount): JsonResponse
    {
        abort_if($adminAccount->is_main_admin, 403, 'The main admin account cannot be edited here.');

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($adminAccount->id)],
            'group_id' => ['nullable', 'integer', 'exists:groups,id'],
        ]);

        if (! empty($validated['group_id'])) {
            User::where('group_id', $validated['group_id'])
                ->where('id', '!=', $adminAccount->id)
                ->where('is_main_admin', false)
                ->update(['group_id' => null]);
        }

        $adminAccount->update([
            'name' => $this->titleCase($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'group_id' => $validated['group_id'] ?? null,
        ]);

        Audit::log($request, 'updated admin account', $adminAccount, $adminAccount->name);

        return response()->json([
            'message' => 'Admin account updated successfully.',
        ]);
    }

    public function destroy(Request $request, User $adminAccount): JsonResponse
    {
        abort_if($adminAccount->is_main_admin, 403, 'The main admin account cannot be deleted.');
        abort_if((int) $request->user()->id === (int) $adminAccount->id, 403, 'You cannot delete your own account here.');

        $adminName = $adminAccount->name;
        $adminAccount->delete();

        Audit::log($request, 'deleted admin account', null, $adminName);

        return response()->json([
            'message' => 'Admin account deleted successfully.',
        ]);
    }

    private function titleCase(string $value): string
    {
        $value = trim($value);

        return preg_replace_callback(
            "/\b(\p{Ll})([\p{L}\p{M}\p{N}_'’-]*)/u",
            fn ($match) => mb_strtoupper($match[1], 'UTF-8') . $match[2],
            $value
        );
    }

    private function passwordRule(): Rules\Password
    {
        return Rules\Password::min(12)
            ->letters()
            ->mixedCase()
            ->numbers()
            ->symbols();
    }
}
