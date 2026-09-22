<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            Parish Registrations
        </h2>
    </x-slot>

    <div class="py-6"> {{-- added: gives top & bottom spacing --}}
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8"> {{-- added: center content --}}
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg"> {{-- added: card design --}}
                <div class="p-6 text-gray-900"> {{-- added: padding --}}

                    <table class="min-w-full border border-gray-200"> {{-- added: table styling --}}
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="px-4 py-2 text-left">Member ID</th>
                                <th class="px-4 py-2 text-left">Full Name</th>
                                <th class="px-4 py-2 text-left">Email</th>
                                <th class="px-4 py-2 text-left">Phone</th>
                                <th class="px-4 py-2 text-left">Registration Type</th>
                                <th class="px-4 py-2 text-left">Signed Date</th>
                                <th class="px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            @foreach($registrations as $registration)
                                <tr class="border-t">
                                    <td class="px-4 py-2">{{ $registration->member_id }}</td>
                                    <td class="px-4 py-2">{{ $registration->full_name }}</td>
                                    <td class="px-4 py-2">{{ $registration->email }}</td>
                                    <td class="px-4 py-2">{{ $registration->phone }}</td>
                                    <td class="px-4 py-2">{{ ucfirst($registration->registration_type) }}</td>
                                    <td class="px-4 py-2">{{ $registration->signed_date }}</td>
                                    <td class="px-4 py-2">
                                        <a href="{{ route('admin.parish-registrations.show', $registration) }}"
                                           class="text-blue-600 hover:underline">
                                            View
                                        </a>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>

                    <div class="mt-4">
                        {{ $registrations->links() }} {{-- pagination --}}
                    </div>

                </div>
            </div>
        </div>
    </div>
</x-app-layout>