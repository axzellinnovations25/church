<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            Edit Registration
        </h2>
    </x-slot>

    <div class="py-6">
        <div class="max-w-5xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white shadow-sm rounded-lg p-6">

                <form method="POST"
                      action="{{ route('admin.parish-registrations.update', $parishRegistration) }}">
                    @csrf
                    @method('PUT')

                    <h3 class="text-lg font-semibold mb-4">Member Info</h3>

                    <div class="grid grid-cols-2 gap-4">
                        <input type="text" name="full_name"
                               value="{{ $parishRegistration->full_name }}"
                               class="border p-2 rounded" placeholder="Full Name">

                        <input type="email" name="email"
                               value="{{ $parishRegistration->email }}"
                               class="border p-2 rounded" placeholder="Email">

                        <input type="text" name="phone"
                               value="{{ $parishRegistration->phone }}"
                               class="border p-2 rounded" placeholder="Phone">

                        <input type="text" name="partner_name"
                               value="{{ $parishRegistration->partner_name }}"
                               class="border p-2 rounded" placeholder="Partner Name">
                    </div>

                    {{-- Children --}}
                    <h3 class="text-lg font-semibold mt-6 mb-2">Children</h3>

                    <div id="children-wrapper">
                        @foreach($parishRegistration->children as $index => $child)
                            <div class="flex gap-2 mb-2">
                                <input type="text"
                                       name="children[{{ $index }}][child_name]"
                                       value="{{ $child->child_name }}"
                                       class="border p-2 rounded"
                                       placeholder="Child Name">

                                <input type="date"
                                       name="children[{{ $index }}][date_of_birth]"
                                       value="{{ $child->date_of_birth }}"
                                       class="border p-2 rounded"
                                       placeholder="Date of Birth">
                            </div>
                        @endforeach
                    </div>

                    {{-- Interests --}}
                    <h3 class="text-lg font-semibold mt-6 mb-2">Interests</h3>

                    <div class="flex flex-col gap-2">
                        <label><input type="checkbox" name="volunteering"
                            {{ $parishRegistration->interest?->volunteering ? 'checked' : '' }}>
                            Volunteering</label>

                        <label><input type="checkbox" name="parish_groups"
                            {{ $parishRegistration->interest?->parish_groups ? 'checked' : '' }}>
                            Parish Groups</label>

                        <label><input type="checkbox" name="sacramental_preparation"
                            {{ $parishRegistration->interest?->sacramental_preparation ? 'checked' : '' }}>
                            Sacramental Preparation</label>

                        <label><input type="checkbox" name="weekly_newsletter"
                            {{ $parishRegistration->interest?->weekly_newsletter ? 'checked' : '' }}>
                            Weekly Newsletter</label>
                    </div>

                    {{-- Buttons --}}
                    <div class="mt-6 flex gap-3">
                        <button type="submit"
                                class="px-4 py-2 bg-green-600 text-white rounded">
                            Save Changes
                        </button>

                        <a href="{{ route('admin.parish-registrations.show', $parishRegistration) }}"
                           class="px-4 py-2 bg-gray-500 text-white rounded">
                            Cancel
                        </a>
                    </div>

                </form>

            </div>
        </div>
    </div>
</x-app-layout>
