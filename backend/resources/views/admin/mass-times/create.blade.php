{{-- resources/views/admin/mass-times/create.blade.php --}}
{{-- Create Mass Time page --}}
{{-- Uses Breeze x-app-layout (same as Events) --}}

<x-app-layout>

    {{-- Page header --}}
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Create Mass Time') }}
        </h2>
    </x-slot>

    <div class="py-8">
        {{-- Full width container --}}
        <div class="w-full px-6 lg:px-12">

            {{-- Card --}}
            <div class="bg-white shadow-sm rounded-lg w-full">
                <div class="p-6">

                    {{-- Mass Time create form --}}
                    <form action="{{ route('admin.mass-times.store') }}" method="POST">
                        @include('admin.mass-times._form')
                    </form>

                </div>
            </div>

        </div>
    </div>

</x-app-layout>
