{{-- resources/views/admin/mass-times/index.blade.php --}}
{{-- Mass Times admin index --}}
{{-- Uses Breeze x-app-layout --}}

<x-app-layout>

    {{-- Page header --}}
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Mass Times') }}
        </h2>
    </x-slot>

    <div class="py-8">
        <div class="w-full px-6 lg:px-12">

            {{-- Top section with button --}}
            <div class="flex items-center justify-between mb-6">
                <p class="text-gray-600">
                    Manage weekly and special Mass times here.
                </p>

                <a href="{{ route('admin.mass-times.create') }}"
                   class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
                    + Create Mass Time
                </a>
            </div>

            {{-- Success message --}}
            @if (session('success'))
                <div class="mb-4 p-4 rounded bg-green-100 border border-green-200 text-green-800">
                    {{ session('success') }}
                </div>
            @endif

            {{-- Main card --}}
            <div class="bg-white shadow-sm rounded-lg w-full">
                <div class="p-6">

                    <div class="overflow-x-auto">

                        <table class="w-full table-fixed border-collapse">

                            {{-- Table headings --}}
                            <thead>
                                <tr class="border-b text-gray-600 uppercase text-sm">

                                    <th class="w-2/12 text-left py-3 px-4 font-semibold">
                                        Day
                                    </th>

                                    <th class="w-2/12 text-left py-3 px-4 font-semibold">
                                        Start Time  
                                    </th>

                                    <th class="w-3/12 text-left py-3 px-4 font-semibold">
                                        Location
                                    </th>

                                    <th class="w-2/12 text-left py-3 px-4 font-semibold">
                                        Language
                                    </th>

                                    <th class="w-1/12 text-left py-3 px-4 font-semibold">
                                        Status
                                    </th>

                                    <th class="w-2/12 text-left py-3 px-4 font-semibold">
                                        Actions
                                    </th>

                                </tr>
                            </thead>

                            {{-- Table data --}}
                            <tbody>
                                @forelse ($massTimes as $massTime)
                                    <tr class="border-b hover:bg-gray-50">

                                        <td class="py-4 px-4 text-gray-900">
                                            {{ $massTime->day }}
                                        </td>

                                        <td class="py-4 px-4 text-gray-700">
                                             {{ \Carbon\Carbon::parse($massTime->start_time)->format('H:i') }}
                                        </td>

                                        <td class="py-4 px-4 text-gray-700">
                                            {{ $massTime->location ?? '-' }}
                                        </td>

                                        <td class="py-4 px-4 text-gray-700">
                                            {{ $massTime->language ?? '-' }}
                                        </td>

                                        <td class="py-4 px-4 text-gray-700">
                                            {{ ucfirst($massTime->status) }}
                                        </td>

                                        <td class="py-4 px-4">
                                            <a href="{{ route('admin.mass-times.edit', $massTime) }}"
                                               class="text-blue-600 hover:underline mr-3">
                                                Edit
                                            </a>

                                            <form action="{{ route('admin.mass-times.destroy', $massTime) }}"
                                                  method="POST"
                                                  class="inline"
                                                  onsubmit="return confirm('Are you sure you want to delete this Mass time?');">
                                                @csrf
                                                @method('DELETE')

                                                <button type="submit"
                                                        class="text-red-600 hover:underline">
                                                    Delete
                                                </button>
                                            </form>
                                        </td>

                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="7"
                                            class="py-10 px-4 text-center text-gray-500">
                                            No Mass times added yet.
                                        </td>
                                    </tr>
                                @endforelse
                            </tbody>

                        </table>

                    </div>

                    {{-- Pagination --}}
                    <div class="mt-6">
                        {{ $massTimes->links() }}
                    </div>

                </div>
            </div>

        </div>
    </div>

</x-app-layout>






