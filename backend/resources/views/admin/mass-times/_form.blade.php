@csrf

<div class="mb-4">
    <label class="block mb-1 font-semibold">Day</label>

    <select name="day" class="w-full border p-2 rounded">
        @php
            $days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            $selectedDay = old('day', $massTime->day ?? '');
        @endphp

        <option value="">Select a day</option>

        @foreach ($days as $day)
            <option value="{{ $day }}" {{ $selectedDay === $day ? 'selected' : '' }}>
                {{ $day }}
            </option>
        @endforeach
    </select>

    @error('day')
        <p class="text-red-600 text-sm mt-1">{{ $message }}</p>
    @enderror
</div>

<div class="mb-4">
    <label class="block mb-1 font-semibold">Time</label>

    <input type="time"
           name="start_time"
           value="{{ old('start_time', isset($massTime) && $massTime->start_time ? \Carbon\Carbon::parse($massTime->start_time)->format('H:i') : '') }}"
           class="w-full border p-2 rounded">

    @error('start_time')
        <p class="text-red-600 text-sm mt-1">{{ $message }}</p>
    @enderror
</div>

<div id="mass-preview"
     class="mb-4 p-4 rounded border bg-gray-50 text-gray-700 hidden">
    <div class="font-semibold mb-2">Existing Mass Times</div>
    <ul id="mass-preview-list" class="list-disc pl-5 space-y-1"></ul>
</div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        const dayEl = document.querySelector('select[name="day"]');
        const locEl = document.querySelector('input[name="location"]');
        const box = document.getElementById('mass-preview');
        const list = document.getElementById('mass-preview-list');

        async function loadPreview() {
            const day = dayEl?.value;
            const location = locEl?.value;

            if (!day) {
                box.classList.add('hidden');
                list.innerHTML = '';
                return;
            }

            const params = new URLSearchParams();
            params.set('day', day);
            if (location) params.set('location', location);

            const res = await fetch(`/admin/mass-times/by-day?${params.toString()}`);
            const data = await res.json();

            list.innerHTML = '';

            if (!data.length) {
                box.classList.remove('hidden');
                list.innerHTML = '<li>No existing Mass Times for this selection.</li>';
                return;
            }

            data.forEach(item => {
                const name = item.language ? `${item.language} Mass` : 'Mass';
                const time = (item.start_time || '').slice(0,5);

                const li = document.createElement('li');
                li.textContent = `${name} (${time})`;
                list.appendChild(li);
            });

            box.classList.remove('hidden');
        }

        dayEl?.addEventListener('change', loadPreview);
        locEl?.addEventListener('input', loadPreview);

        loadPreview();
    });
</script>

<div class="mb-4">
    <label class="block mb-1 font-semibold">Location (optional)</label>
    <input type="text"
           name="location"
           value="{{ old('location', $massTime->location ?? '') }}"
           class="w-full border p-2 rounded"
           placeholder="e.g., Cathedral">
</div>

<div class="mb-4">
    <label class="block mb-1 font-semibold">Language (optional)</label>
    <input type="text"
           name="language"
           value="{{ old('language', $massTime->language ?? '') }}"
           class="w-full border p-2 rounded"
           placeholder="e.g., English">
</div>

<div class="mb-4">
    <label class="block mb-1 font-semibold">Notes (optional)</label>
    <textarea name="notes"
              class="w-full border p-2 rounded"
              rows="3"
              placeholder="Any extra details...">{{ old('notes', $massTime->notes ?? '') }}</textarea>
</div>

<div class="mb-4">
    <label class="block mb-1 font-semibold">Status</label>
    <select name="status" class="w-full border p-2 rounded">
        <option value="draft" {{ old('status', $massTime->status ?? 'draft') === 'draft' ? 'selected' : '' }}>
            Draft
        </option>
        <option value="published" {{ old('status', $massTime->status ?? 'draft') === 'published' ? 'selected' : '' }}>
            Published
        </option>
    </select>
</div>

<div class="flex gap-3">
    <button type="submit"
            class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
        Save
    </button>

    <a href="{{ route('admin.mass-times.index') }}"
       class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
        Cancel
    </a>
</div>