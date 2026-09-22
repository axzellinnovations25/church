<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Edit Event') }}
        </h2>
    </x-slot>

    <div class="py-6">
        <div class="max-w-3xl mx-auto sm:px-6 lg:px-8">

            <div class="bg-white shadow-sm sm:rounded-lg p-6">

                @if ($errors->any())
                    <div class="mb-4 p-3 bg-red-100 border border-red-300 rounded">
                        <ul class="list-disc ml-5 text-sm text-red-800">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <form method="POST" action="{{ route('admin.events.update', $event) }}">
                    @csrf
                    @method('PUT')

                    <div class="mb-4">
                        <label class="block mb-1 font-medium">Title *</label>
                        <input type="text" name="title"
                               value="{{ old('title', $event->title) }}"
                               class="w-full border rounded p-2"
                               required>
                    </div>

                    <div class="mb-4">
                        <label class="block mb-1 font-medium">Description</label>
                        <textarea name="description"
                                  rows="4"
                                  class="w-full border rounded p-2">{{ old('description', $event->description) }}</textarea>
                    </div>

                    <div class="mb-4">
                        <label class="block mb-1 font-medium">Start Date *</label>
                        <input id="start_date" type="date" name="start_date"
                               value="{{ old('start_date', $event->start_date) }}"
                               class="w-full border rounded px-3 py-2"
                               required>
                    </div>

                    <div class="mb-4 p-4 bg-gray-50 border rounded">
                        <p class="font-semibold text-gray-700 mb-2">
                            Events already booked on this date
                        </p>
                        <ul id="existing-events" class="text-sm text-gray-600 space-y-1">
                            <li>Loading...</li>
                        </ul>
                    </div>

                    <div class="mb-4">
                        <label class="inline-flex items-center">
                            <input type="checkbox"
                                   name="all_day"
                                   id="all_day"
                                   class="mr-2"
                                   {{ old('all_day', ($event->start_time === '00:00' && $event->end_time === '23:59')) ? 'checked' : '' }}>
                            All Day Event
                        </label>
                    </div>

                    <div class="mb-4">
                        <label class="block mb-1 font-medium">Start Time *</label>
                        <input type="time"
                               id="start_time"
                               name="start_time"
                               value="{{ old('start_time', $event->start_time ? \Carbon\Carbon::parse($event->start_time)->format('H:i') : '') }}"
                               class="w-full border rounded px-3 py-2"
                               required>
                    </div>

                    <div class="mb-4">
                        <label class="block mb-1 font-medium">End Date</label>
                        <input type="date"
                               name="end_date"
                               value="{{ old('end_date', $event->end_date) }}"
                               class="w-full border rounded px-3 py-2">
                    </div>

                    <div class="mb-4">
                        <label class="block mb-1 font-medium">End Time *</label>
                        <input type="time"
                               id="end_time"
                               name="end_time"
                               value="{{ old('end_time', $event->end_time ? \Carbon\Carbon::parse($event->end_time)->format('H:i') : '') }}"
                               class="w-full border rounded px-3 py-2"
                               required>
                    </div>

                    <div class="mb-4">
                        <label class="block mb-1 font-medium">Location</label>
                        <input type="text" name="location"
                               value="{{ old('location', $event->location) }}"
                               class="w-full border rounded p-2">
                    </div>

                    <div class="mb-4">
                        <label class="block mb-1 font-medium">Category</label>
                        <input type="text" name="category"
                               value="{{ old('category', $event->category) }}"
                               class="w-full border rounded p-2">
                    </div>

                    <div class="mb-6">
                        <label class="block mb-1 font-medium">Status *</label>
                        <select name="status"
                                class="w-full border rounded p-2"
                                required>
                            <option value="published"
                                {{ old('status', $event->status) === 'published' ? 'selected' : '' }}>
                                Published
                            </option>
                            <option value="draft"
                                {{ old('status', $event->status) === 'draft' ? 'selected' : '' }}>
                                Draft
                            </option>
                        </select>
                    </div>

                    <div class="mt-6 flex items-center gap-4">
                        <input type="submit"
                               value="Update Event"
                               class="px-5 py-2 bg-black text-white rounded hover:bg-gray-800 cursor-pointer">

                        <a href="{{ route('admin.events.index') }}"
                           class="px-5 py-2 border rounded text-gray-700 hover:bg-gray-100">
                             Cancel
                        </a>
                    </div>

                </form>

                <script>
                    document.addEventListener('DOMContentLoaded', function () {

                        const dateInput = document.getElementById('start_date');
                        const list = document.getElementById('existing-events');

                        const allDayCheckbox = document.getElementById('all_day');
                        const startTimeInput = document.getElementById('start_time');
                        const endTimeInput = document.getElementById('end_time');

                        const currentEventId = parseInt("{{ $event->id }}");
                        const url = "{{ route('admin.events.by-date') }}";

                        function formatTime(t) {
                            if (!t) return '';
                            return String(t).slice(0, 5);
                        }

                        async function loadEvents(date) {
                            if (!date) {
                                list.innerHTML = '<li>Select a date to see booked time slots.</li>';
                                return;
                            }

                            const res = await fetch(`${url}?date=${date}`);
                            const data = await res.json();

                            const filtered = data.filter(e => e.id !== currentEventId);

                            if (!filtered.length) {
                                list.innerHTML = '<li>No other events on this date.</li>';
                                return;
                            }

                            list.innerHTML = filtered.map(e => {
                                const start = formatTime(e.start_time) || '00:00';
                                const end = formatTime(e.end_time) || '23:59';
                                return `<li>• ${e.title} (${start} - ${end})</li>`;
                            }).join('');
                        }

                        function toggleAllDay() {
                            if (allDayCheckbox.checked) {
                                startTimeInput.value = '00:00';
                                endTimeInput.value = '23:59';
                                startTimeInput.readOnly = true;
                                endTimeInput.readOnly = true;
                            } else {
                                startTimeInput.readOnly = false;
                                endTimeInput.readOnly = false;
                            }
                        }

                        if (dateInput && dateInput.value) {
                            loadEvents(dateInput.value);
                        }

                        if (dateInput) {
                            dateInput.addEventListener('change', e => loadEvents(e.target.value));
                        }

                        if (allDayCheckbox) {
                            allDayCheckbox.addEventListener('change', toggleAllDay);
                        }

                        toggleAllDay();
                    });
                </script>

            </div>
        </div>
    </div>
</x-app-layout>