<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to St Mary's Cathedral</title>
</head>
<body style="font-family: Arial, sans-serif; color: #202020; line-height: 1.55;">

<h2>Welcome to St Mary's Cathedral Parish</h2>

<p>Dear {{ $registration->full_name }},</p>

<p>Thank you for registering with St Mary's Cathedral Parish.</p>

<p>We are delighted to welcome you{{ $registration->registration_type === 'family' ? ' and your family' : '' }} to our parish community.</p>

<p>
    Your registered parish member ID is:
    <strong>{{ $registration->member_id }}</strong>
</p>

<h3>Registration Details</h3>

<table cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 640px;">
    <tr>
        <td style="border: 1px solid #ddd;"><strong>Registration type</strong></td>
        <td style="border: 1px solid #ddd;">{{ ucfirst($registration->registration_type) }}</td>
    </tr>
    <tr>
        <td style="border: 1px solid #ddd;"><strong>Full name</strong></td>
        <td style="border: 1px solid #ddd;">{{ $registration->full_name }}</td>
    </tr>
    @if($registration->partner_name)
        <tr>
            <td style="border: 1px solid #ddd;"><strong>Spouse / partner</strong></td>
            <td style="border: 1px solid #ddd;">{{ $registration->partner_name }}</td>
        </tr>
    @endif
    <tr>
        <td style="border: 1px solid #ddd;"><strong>Email</strong></td>
        <td style="border: 1px solid #ddd;">{{ $registration->email }}</td>
    </tr>
    <tr>
        <td style="border: 1px solid #ddd;"><strong>Phone</strong></td>
        <td style="border: 1px solid #ddd;">{{ $registration->phone }}</td>
    </tr>
    <tr>
        <td style="border: 1px solid #ddd;"><strong>Address</strong></td>
        <td style="border: 1px solid #ddd;">
            {{ $registration->address_line1 }}<br>
            @if($registration->address_line2)
                {{ $registration->address_line2 }}<br>
            @endif
            {{ $registration->city }}<br>
            {{ $registration->postcode }}
        </td>
    </tr>
    <tr>
        <td style="border: 1px solid #ddd;"><strong>Signed date</strong></td>
        <td style="border: 1px solid #ddd;">{{ $registration->signed_date }}</td>
    </tr>
</table>

@if($registration->children->isNotEmpty())
    <h3>Family Details</h3>
    <ul>
        @foreach($registration->children as $child)
            <li>{{ $child->child_name }}@if(!is_null($child->date_of_birth)) - DOB {{ \Illuminate\Support\Carbon::parse($child->date_of_birth)->format('d M Y') }}@endif</li>
        @endforeach
    </ul>
@endif

@if($registration->interest)
    <h3>Parish Interests</h3>
    <ul>
        @if($registration->interest->volunteering)
            <li>Volunteering</li>
        @endif
        @if($registration->interest->parish_groups)
            <li>Parish groups</li>
        @endif
        @if($registration->interest->sacramental_preparation)
            <li>Sacramental preparation</li>
        @endif
        @if($registration->interest->weekly_newsletter)
            <li>Weekly newsletter</li>
        @endif
        @if(
            ! $registration->interest->volunteering &&
            ! $registration->interest->parish_groups &&
            ! $registration->interest->sacramental_preparation &&
            ! $registration->interest->weekly_newsletter
        )
            <li>No parish interests selected.</li>
        @endif
    </ul>
@endif

<p>If you have any questions or would like to become involved in parish activities,
please feel free to contact the parish office.</p>

<p>May God bless you and your family.</p>

<p>
Kind regards,<br>
St Mary's Cathedral<br>
Wrexham
</p>

</body>
</html>
