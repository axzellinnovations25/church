{{-- This page shows the form to create an event --}}
<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Create Event') }}
        </h2>
    </x-slot>

    <div class="py-6">
        <div class="max-w-3xl mx-auto sm:px-6 lg:px-8">

            <div class="bg-white shadow-sm sm:rounded-lg p-6">

                {{-- Show validation errors if user submits wrong data --}}
                @if ($errors->any())
                    <div class="mb-4 p-3 bg-red-100 border border-red-300 rounded">
                        <ul class="list-disc ml-5">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                {{-- Create form --}}
                <form method="POST" action="{{ route('admin.events.store') }}">
                    @csrf {{-- CSRF protection token --}}

                    {{-- Title --}}
                    <div class="mb-4">
                        <label class="block mb-1">Title *</label>
                        <input type="text" name="title" value="{{ old('title') }}"
                               class="w-full border rounded p-2" required>
                    </div>

                    {{-- Description --}}
                    <div class="mb-4">
                        <label class="block mb-1">Description</label>
                        <textarea name="description" class="w-full border rounded p-2"
                                  rows="4">{{ old('description') }}</textarea>
                    </div>

                    {{-- Start date --}}
                    <div class="mb-4">
                        <label class="block mb-1">Start Date *</label>
                        <input id="start_date" type="date" name="start_date"
                               value="{{ old('start_date') }}"
                               class="w-full border rounded px-3 py-2" required>
                    </div>

                    {{-- Existing events on selected date --}}
                    <div class="mb-4 p-4 bg-gray-50 border rounded">
                        <p class="font-semibold text-gray-700 mb-2">
                            Events already booked on this date
                        </p>
                        <ul id="existing-events" class="text-sm text-gray-600 space-y-1">
                            <li>Select a date to see booked time slots.</li>
                        </ul>
                    </div>

                    {{-- All day event checkbox --}}
                    <div class="mb-4">
                        <label class="inline-flex items-center">
                            <input type="checkbox"
                                   name="all_day"
                                   id="all_day"
                                   class="mr-2"
                                   {{ old('all_day') ? 'checked' : '' }}>
                            All Day Event
                        </label>
                    </div>

                    {{-- Start time --}}
                    <div class="mb-4">
                        <label class="block mb-1">Start Time *</label>
                        <input type="time"
                               id="start_time"
                               name="start_time"
                               value="{{ old('start_time') }}"
                               class="w-full border rounded px-3 py-2">
                    </div>

                    {{-- End date --}}
                    <div class="mb-4">
                        <label class="block mb-1">End Date</label>
                        <input type="date"
                               name="end_date"
                               value="{{ old('end_date') }}"
                               class="w-full border rounded px-3 py-2">
                    </div>

                    {{-- End time --}}
                    <div class="mb-4">
                        <label class="block mb-1">End Time *</label>
                        <input type="time"
                               id="end_time"
                               name="end_time"
                               value="{{ old('end_time') }}"
                               class="w-full border rounded px-3 py-2">
                    </div>

                    {{-- Location --}}
                    <div class="mb-4">
                        <label class="block mb-1">Location</label>
                        <input type="text"
                               name="location"
                               value="{{ old('location') }}"
                               class="w-full border rounded p-2">
                    </div>

                    {{-- Category --}}
                    <div class="mb-4">
                        <label class="block mb-1">Category</label>
                        <input type="text"
                               name="category"
                               value="{{ old('category') }}"
                               class="w-full border rounded p-2">
                    </div>

                    {{-- Status --}}
                    <div class="mb-6">
                        <label class="block mb-1">Status *</label>
                        <select name="status" class="w-full border rounded p-2" required>
                            <option value="published"
                                {{ old('status') === 'published' ? 'selected' : '' }}>
                                Published
                            </option>
                            <option value="draft"
                                {{ old('status') === 'draft' ? 'selected' : '' }}>
                                Draft
                            </option>
                        </select>
                    </div>

                    {{-- Buttons --}}
                    <div class="flex gap-3">
                        <button type="submit"
                                class="px-4 py-2 bg-black text-white rounded">
                            Save Event
                        </button>

                        <a href="{{ route('admin.events.index') }}"
                           class="px-4 py-2 border rounded">
                            Cancel
                        </a>
                    </div>

                </form>

                {{-- Script for showing booked events + handling all day --}}
                <script>
                    document.addEventListener('DOMContentLoaded', function () {

                        const dateInput = document.getElementById('start_date');
                        const list = document.getElementById('existing-events');

                        const allDayCheckbox = document.getElementById('all_day');
                        const startTimeInput = document.getElementById('start_time');
                        const endTimeInput = document.getElementById('end_time');

                        function formatTime(t) {
                            if (!t) return '';
                            return String(t).slice(0, 5);
                        }

                        async function loadEvents(date) {
                            if (!date) {
                                list.innerHTML = '<li>Select a date to see booked time slots.</li>';
                                return;
                            }

                            const res = await fetch(`{{ route('admin.events.by-date') }}?date=${date}`);
                            const data = await res.json();

                            if (!data.length) {
                                list.innerHTML = '<li>No other events on this date.</li>';
                                return;
                            }

                            list.innerHTML = data.map(e => {
                                const start = formatTime(e.start_time) || '00:00';
                                const end = formatTime(e.end_time) || '23:59';
                                return `<li>• ${e.title} (${start} - ${end})</li>`;
                            }).join('');
                        }

                        function toggleAllDay() {
                            if (allDayCheckbox.checked) {
                                //lock fields but still send value
                                startTimeInput.value = '00:00';
                                endTimeInput.value = '23:59';
                                startTimeInput.readOnly = true;
                                endTimeInput.readOnly = true;
                            } else {
                                //unlock fields for editing
                                startTimeInput.readOnly = false;
                                endTimeInput.readOnly = false;
                            }
                        }

                        if (dateInput && dateInput.value) {
                            loadEvents(dateInput.value);
                        }

                        dateInput?.addEventListener('change', e => loadEvents(e.target.value));
                        allDayCheckbox?.addEventListener('change', toggleAllDay);

                        toggleAllDay();
                    });
                </script>

            </div>
        </div>
    </div>
</x-app-layout>