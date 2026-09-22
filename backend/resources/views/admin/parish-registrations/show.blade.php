<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            Registration Details
        </h2>
    </x-slot>

    <div class="py-6">
        <div class="max-w-5xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white shadow-sm rounded-lg p-6">

                <h3 class="text-lg font-semibold mb-4">Member Information</h3>

                <div class="grid grid-cols-2 gap-4">
                    <div><strong>Member ID:</strong> {{ $parishRegistration->member_id }}</div>
                    <div><strong>Full Name:</strong> {{ $parishRegistration->full_name }}</div>
                    <div><strong>Partner Name:</strong> {{ $parishRegistration->partner_name ?? 'N/A' }}</div>
                    <div><strong>Email:</strong> {{ $parishRegistration->email }}</div>
                    <div><strong>Phone:</strong> {{ $parishRegistration->phone }}</div>
                    <div><strong>Type:</strong> {{ ucfirst($parishRegistration->registration_type) }}</div>
                    <div><strong>Signed Date:</strong> {{ $parishRegistration->signed_date }}</div>
                </div>

                {{-- Children --}}
                @if($parishRegistration->children->count())
                    <h3 class="text-lg font-semibold mt-6 mb-2">Children</h3>

                    <ul class="list-disc pl-6">
                        @foreach($parishRegistration->children as $child)
                            <li>{{ $child->child_name }} (DOB: {{ $child->date_of_birth ? \Illuminate\Support\Carbon::parse($child->date_of_birth)->format('d M Y') : 'N/A' }})</li>
                        @endforeach
                    </ul>
                @endif

                {{-- Interests --}}
                @if($parishRegistration->interest)
                    <h3 class="text-lg font-semibold mt-6 mb-2">Interests</h3>

                    <ul class="list-disc pl-6">
                        @if($parishRegistration->interest->volunteering)
                            <li>Volunteering</li>
                        @endif
                        @if($parishRegistration->interest->parish_groups)
                            <li>Parish Groups</li>
                        @endif
                        @if($parishRegistration->interest->sacramental_preparation)
                            <li>Sacramental Preparation</li>
                        @endif
                        @if($parishRegistration->interest->weekly_newsletter)
                            <li>Weekly Newsletter</li>
                        @endif
                    </ul>
                @endif

                {{-- Buttons --}}
                <div class="mt-6 flex items-center gap-3">
                    <a href="{{ route('admin.parish-registrations.index') }}"
                       class="inline-block px-4 py-2 bg-gray-500 text-white rounded">
                        Back
                    </a>
                 <!-- edit button -->
                    <a href="{{ route('admin.parish-registrations.edit', $parishRegistration) }}"
                       style="background:blue; color:white; padding:10px; display:inline-block;">
                        Edit
                    </a>
                <!--delete buton-->
                    <form method="POST"
                          action="{{ route('admin.parish-registrations.destroy', $parishRegistration) }}"
                          onsubmit="return confirm('Are you sure you want to delete this registration?')"
                          class="inline-block">
                        @csrf
                        @method('DELETE')

                        <button type="submit"
                                class="inline-block px-4 py-2 bg-red-600 text-white rounded">
                            Delete
                        </button>
                    </form>
                </div>

            </div>
        </div>
    </div>
</x-app-layout>

