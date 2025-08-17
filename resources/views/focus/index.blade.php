@extends('layouts.app')

@section('title', 'Focus Timer')

@section('content')
<div id="focus-app"></div>
@endsection

@push('scripts')
@vite(['resources/js/pages/Focus/Index.tsx'])
@endpush