<x-app-layout>

    {{-- Page header (TITLE ONLY - Breeze-safe) --}}
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Events') }}
        </h2>
    </x-slot>

    <div class="py-8">
        {{-- FULL screen container --}}
        <div class="w-full px-6 lg:px-12">

            {{-- Top action bar --}}
            <div class="flex items-center justify-between mb-6">
                <p class="text-gray-600">
                    Manage all cathedral events here.
                </p>

                {{-- Create Event button --}}
                <a href="{{ route('admin.events.create') }}"
                   class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
                    + Create Event
                </a>
            </div>

            {{-- Success message --}}
            @if (session('success'))
                <div class="mb-4 p-4 rounded bg-green-100 border border-green-200 text-green-800">
                    {{ session('success') }}
                </div>
            @endif

            {{-- FULL width card --}}
            <div class="bg-white shadow-sm rounded-lg w-full">
                <div class="p-6">

                    {{-- Table wrapper --}}
                    <div class="overflow-x-auto">

                        <table class="w-full table-fixed border-collapse">

                            <thead>
                                <tr class="border-b text-gray-600 uppercase text-sm">

                                    <th class="w-3/12 text-left py-3 px-4 font-semibold">
                                        Title
                                    </th>

                                    <th class="w-2/12 text-left py-3 px-4 font-semibold">
                                        Start Date
                                    </th>

                                    <th class="w-2/12 text-left py-3 px-4 font-semibold">
                                        End Date
                                    </th>

                                    <th class="w-3/12 text-left py-3 px-4 font-semibold">
                                        Location
                                    </th>

                                    <th class="w-1/12 text-left py-3 px-4 font-semibold">
                                        Status
                                    </th>

                                    <th class="w-1/12 text-left py-3 px-4 font-semibold">
                                        Actions
                                    </th>

                                </tr>
                            </thead>

                            <tbody>
                                @forelse ($events as $event)
                                    <tr class="border-b hover:bg-gray-50">

                                        <td class="py-4 px-4 text-gray-900">
                                            {{ ucfirst($event->title) }}
                                        </td>

                                        <td class="py-4 px-4 text-gray-700">
                                            {{ $event->start_date }}
                                        </td>

                                        <td class="py-4 px-4 text-gray-700">
                                            {{ $event->end_date ?? '-' }}
                                        </td>

                                        <td class="py-4 px-4 text-gray-700">
                                            {{ $event->location ?? '-' }}
                                        </td>

                                        <td class="py-4 px-4 text-gray-700">
                                            {{ ucfirst($event->status) }}
                                        </td>

                                        <td class="py-4 px-4">
                                            <a href="{{ route('admin.events.edit', $event) }}"
                                               class="text-blue-600 hover:underline mr-3">
                                                Edit
                                            </a>

                                            <form action="{{ route('admin.events.destroy', $event) }}"
                                                  method="POST"
                                                  class="inline"
                                                  onsubmit="return confirm('Are you sure you want to delete this event?');">
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
                                        <td colspan="6"
                                            class="py-10 px-4 text-center text-gray-500">
                                            No events added yet.
                                        </td>
                                    </tr>
                                @endforelse
                            </tbody>

                        </table>

                    </div>

                </div>
            </div>

        </div>
    </div>

</x-app-layout>
