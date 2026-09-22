<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

use App\Models\ContactMessage;
use App\Models\Event;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\MassTime;
use App\Models\Newsletter;
use App\Models\NewsPost;
use App\Models\ParishChild;
use App\Models\ParishCouncilMember;
use App\Models\ParishInterest;
use App\Models\ParishRegistration;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Fixed, realistic, English-only example data (no Faker/placeholder phrases).
        // Run via: php artisan migrate:fresh --seed

        $defaultAdminPassword = 'password';

        // 1) Groups (8)
        $groups = collect([
            [
                'name' => 'Choir',
                'slug' => 'choir',
                'description' => 'The parish choir leads the congregation in hymns and sacred music at Sunday Mass and major feast days.',
            ],
            [
                'name' => 'Youth Group',
                'slug' => 'youth-group',
                'description' => 'A welcoming community for teenagers and young adults, with formation, service projects, and social events.',
            ],
            [
                'name' => 'Readers',
                'slug' => 'readers',
                'description' => 'Lay ministers who proclaim the readings at Mass and help the Word of God be heard clearly and reverently.',
            ],
            [
                'name' => 'Altar Servers',
                'slug' => 'altar-servers',
                'description' => 'Servers assist the priest at Mass by carrying candles, holding the missal, and supporting the liturgy.',
            ],
            [
                'name' => 'RCIA',
                'slug' => 'rcia',
                'description' => 'The Rite of Christian Initiation of Adults helps adults explore the Catholic faith and prepare for the sacraments.',
            ],
            [
                'name' => 'St Vincent de Paul Society',
                'slug' => 'st-vincent-de-paul',
                'description' => 'A charitable group offering practical support to people in need through home visits and local assistance.',
            ],
            [
                'name' => 'Prayer Group',
                'slug' => 'prayer-group',
                'description' => 'A weekly gathering for scripture reflection, intercession, and prayer for the parish and the wider community.',
            ],
            [
                'name' => 'Parish Finance Committee',
                'slug' => 'parish-finance-committee',
                'description' => 'A committee that supports the parish with budgeting, stewardship, and responsible financial oversight.',
            ],
        ])->map(fn (array $g) => Group::create([
            'name' => $g['name'],
            'slug' => $g['slug'],
            'description' => $g['description'],
            'is_active' => true,
        ]));

        // 2) Admin accounts: 1 main admin + 10 additional admins, 6 assigned to groups
        $mainAdmin = User::create([
            'name' => 'Michael O\'Connor',
            'email' => 'main-admin@stmarys.test',
            'is_main_admin' => true,
            'group_id' => null,
            'password' => $defaultAdminPassword,
            'hidden_overview_items' => null,
        ]);

        $groupAdminProfiles = [
            ['name' => 'Sarah Bennett', 'email' => 'choir-admin@stmarys.test'],
            ['name' => 'Daniel Hughes', 'email' => 'youth-group-admin@stmarys.test'],
            ['name' => 'Emily Carter', 'email' => 'readers-admin@stmarys.test'],
            ['name' => 'James Walker', 'email' => 'altar-servers-admin@stmarys.test'],
            ['name' => 'Aisha Khan', 'email' => 'rcia-admin@stmarys.test'],
            ['name' => 'Thomas Murphy', 'email' => 'st-vincent-de-paul-admin@stmarys.test'],
        ];

        $groupAdmins = collect();
        foreach ($groups->take(6)->values() as $idx => $group) {
            $profile = $groupAdminProfiles[$idx];
            $groupAdmins->push(User::create([
                'name' => $profile['name'],
                'email' => $profile['email'],
                'is_main_admin' => false,
                'group_id' => $group->id,
                'password' => $defaultAdminPassword,
                'hidden_overview_items' => null,
            ]));
        }

        $unassignedAdmins = collect([
            ['name' => 'Grace Thompson', 'email' => 'admin-grace.thompson@stmarys.test'],
            ['name' => 'Peter Collins', 'email' => 'admin-peter.collins@stmarys.test'],
            ['name' => 'Rachel Evans', 'email' => 'admin-rachel.evans@stmarys.test'],
            ['name' => 'David Foster', 'email' => 'admin-david.foster@stmarys.test'],
        ])->map(fn (array $a) => User::create([
            'name' => $a['name'],
            'email' => $a['email'],
            'is_main_admin' => false,
            'group_id' => null,
            'password' => $defaultAdminPassword,
            'hidden_overview_items' => null,
        ]));

        // Helpers
        $today = now()->toDateString();
        $cathedral = "St Mary's Cathedral";

        // 3) Group members (>=4 each), group events (3-5 each), contact messages (4-6 each)
        $groupData = [
            'choir' => [
                'members' => [
                    ['name' => 'Olivia Price', 'email' => 'olivia.price@example.com', 'phone' => '+44 7700 900101', 'role' => 'Choir Director'],
                    ['name' => 'Andrew Lewis', 'email' => 'andrew.lewis@example.com', 'phone' => '+44 7700 900102', 'role' => 'Organist'],
                    ['name' => 'Hannah Cooper', 'email' => 'hannah.cooper@example.com', 'phone' => '+44 7700 900103', 'role' => 'Member'],
                    ['name' => 'Matthew King', 'email' => 'matthew.king@example.com', 'phone' => '+44 7700 900104', 'role' => 'Member'],
                    ['name' => 'Sophie Ward', 'email' => 'sophie.ward@example.com', 'phone' => '+44 7700 900105', 'role' => 'Member'],
                ],
                'events' => [
                    [
                        'title' => 'Choir Christmas Carol Service',
                        'description' => 'A festive evening of carols, scripture readings, and seasonal music led by the cathedral choir.',
                        'start_date' => '2024-12-15',
                        'start_time' => '18:30:00',
                        'end_date' => '2024-12-15',
                        'end_time' => '19:45:00',
                        'location' => "St Mary's Cathedral",
                        'status' => 'published',
                        'category' => 'liturgy',
                    ],
                    [
                        'title' => 'Music Planning Meeting',
                        'description' => 'Planning session to finalise music selections for Pentecost and the coming month.',
                        'start_date' => '2026-05-13',
                        'start_time' => '18:30:00',
                        'end_date' => '2026-05-13',
                        'end_time' => '19:15:00',
                        'location' => 'Parish Meeting Room',
                        'status' => 'published',
                        'category' => 'liturgy',
                    ],
                    [
                        'title' => 'Choir Warm-Up (Sunday Mass)',
                        'description' => 'Warm-up and sound check before the 11:00 Mass. Please arrive on time.',
                        'start_date' => '2026-05-10',
                        'start_time' => '10:15:00',
                        'end_date' => '2026-05-10',
                        'end_time' => '10:45:00',
                        'location' => 'Choir Loft',
                        'status' => 'published',
                        'category' => 'liturgy',
                    ],
                    [
                        'title' => 'Choir Social Evening',
                        'description' => 'An informal get-together after rehearsal to welcome new members and build community.',
                        'start_date' => '2026-05-20',
                        'start_time' => '20:45:00',
                        'end_date' => '2026-05-20',
                        'end_time' => '22:00:00',
                        'location' => 'Parish Hall',
                        'status' => 'published',
                        'category' => 'community',
                    ],
                ],
                'messages' => [
                    ['name' => 'Helen Jacobs', 'email' => 'helen.jacobs@example.com', 'subject' => 'Joining the Choir', 'category' => 'groups', 'message' => 'Hello, I am new to the parish and would love to join the choir. Could you let me know rehearsal times and whether auditions are required?'],
                    ['name' => 'Mark Richardson', 'email' => 'mark.richardson@example.com', 'subject' => 'Music for Wedding Mass', 'category' => 'general', 'message' => 'Hi, we are getting married at the cathedral in June. Could someone advise on the music options and any choir involvement?'],
                    ['name' => 'Anna Patel', 'email' => 'anna.patel@example.com', 'subject' => 'Psalm Settings', 'category' => 'groups', 'message' => 'Could you share the psalm settings for the next two Sundays so I can practise in advance?'],
                    ['name' => 'George Miller', 'email' => 'george.miller@example.com', 'subject' => 'Choir Rota', 'category' => 'groups', 'message' => 'Please confirm whether we are singing at the 11:00 Mass this Sunday and if there is a rota for upcoming weeks.'],
                ],
            ],
            'youth-group' => [
                'members' => [
                    ['name' => 'Lucy Howard', 'email' => 'lucy.howard@example.com', 'phone' => '+44 7700 900201', 'role' => 'Coordinator'],
                    ['name' => 'Ben Turner', 'email' => 'ben.turner@example.com', 'phone' => '+44 7700 900202', 'role' => 'Volunteer'],
                    ['name' => 'Amelia Scott', 'email' => 'amelia.scott@example.com', 'phone' => '+44 7700 900203', 'role' => 'Member'],
                    ['name' => 'Noah Green', 'email' => 'noah.green@example.com', 'phone' => '+44 7700 900204', 'role' => 'Member'],
                ],
                'events' => [
                    [
                        'title' => 'Youth Group Summer Social',
                        'description' => 'A relaxed summer gathering for young people with games, food, prayer, and time together in the parish hall.',
                        'start_date' => '2024-07-20',
                        'start_time' => '18:00:00',
                        'end_date' => '2024-07-20',
                        'end_time' => '20:30:00',
                        'location' => 'Parish Hall',
                        'status' => 'published',
                        'category' => 'youth',
                    ],
                    [
                        'title' => 'Service Project Planning',
                        'description' => 'Planning meeting for the upcoming food-bank collection and parish clean-up.',
                        'start_date' => '2026-05-15',
                        'start_time' => '18:30:00',
                        'end_date' => '2026-05-15',
                        'end_time' => '19:15:00',
                        'location' => 'Parish Meeting Room',
                        'status' => 'published',
                        'category' => 'community',
                    ],
                    [
                        'title' => 'Youth Group Trip Briefing',
                        'description' => 'Briefing for parents and young people ahead of the diocesan youth day.',
                        'start_date' => '2026-05-22',
                        'start_time' => '19:00:00',
                        'end_date' => '2026-05-22',
                        'end_time' => '19:45:00',
                        'location' => 'Parish Hall',
                        'status' => 'published',
                        'category' => 'youth',
                    ],
                ],
                'messages' => [
                    ['name' => 'Claire Wilson', 'email' => 'claire.wilson@example.com', 'subject' => 'Youth Group Age Range', 'category' => 'groups', 'message' => 'Hi, what is the age range for the youth group, and do you meet every week?'],
                    ['name' => 'Paul Edwards', 'email' => 'paul.edwards@example.com', 'subject' => 'Safeguarding and Consent Forms', 'category' => 'general', 'message' => 'Could you send the consent forms and safeguarding information for youth activities?'],
                    ['name' => 'Megan Clarke', 'email' => 'megan.clarke@example.com', 'subject' => 'Volunteering to Help', 'category' => 'volunteering', 'message' => 'Hello, I would like to volunteer with the youth group. Please let me know the next steps and any required checks.'],
                    ['name' => 'Jason Moore', 'email' => 'jason.moore@example.com', 'subject' => 'Diocesan Youth Day', 'category' => 'groups', 'message' => 'Is the youth group attending the diocesan youth day this year, and how do we register?'],
                ],
            ],
            'readers' => [
                'members' => [
                    ['name' => 'Eleanor Brown', 'email' => 'eleanor.brown@example.com', 'phone' => '+44 7700 900301', 'role' => 'Coordinator'],
                    ['name' => 'Christopher White', 'email' => 'christopher.white@example.com', 'phone' => '+44 7700 900302', 'role' => 'Reader'],
                    ['name' => 'Isabella Hall', 'email' => 'isabella.hall@example.com', 'phone' => '+44 7700 900303', 'role' => 'Reader'],
                    ['name' => 'Samuel Young', 'email' => 'samuel.young@example.com', 'phone' => '+44 7700 900304', 'role' => 'Reader'],
                ],
                'events' => [
                    [
                        'title' => 'Readers Advent Reflection Morning',
                        'description' => 'A formation morning for parish readers with prayer, scripture reflection, and practical preparation for Advent readings.',
                        'start_date' => '2025-11-22',
                        'start_time' => '10:00:00',
                        'end_date' => '2025-11-22',
                        'end_time' => '12:00:00',
                        'location' => 'Parish Meeting Room',
                        'status' => 'published',
                        'category' => 'formation',
                    ],
                    [
                        'title' => 'Readers Rota Review',
                        'description' => 'Review and confirm the rota for the next four weeks of Sunday Masses.',
                        'start_date' => '2026-05-16',
                        'start_time' => '11:45:00',
                        'end_date' => '2026-05-16',
                        'end_time' => '12:15:00',
                        'location' => 'Sacristy',
                        'status' => 'published',
                        'category' => 'liturgy',
                    ],
                    [
                        'title' => 'Lectio Divina (Readers)',
                        'description' => 'A quiet hour of scripture reflection to deepen our love for the Word of God.',
                        'start_date' => '2026-05-23',
                        'start_time' => '10:00:00',
                        'end_date' => '2026-05-23',
                        'end_time' => '11:00:00',
                        'location' => 'Chapel',
                        'status' => 'published',
                        'category' => 'formation',
                    ],
                ],
                'messages' => [
                    ['name' => 'John Saunders', 'email' => 'john.saunders@example.com', 'subject' => 'Becoming a Reader', 'category' => 'groups', 'message' => 'Hello, I would like to join the readers ministry. Is there training and a rota system?'],
                    ['name' => 'Maria Lopez', 'email' => 'maria.lopez@example.com', 'subject' => 'Reading at a Funeral Mass', 'category' => 'general', 'message' => 'Could you advise how the readings are arranged for a funeral Mass, and whether family members may read?'],
                    ['name' => 'Stephen Gray', 'email' => 'stephen.gray@example.com', 'subject' => 'Rota Availability', 'category' => 'groups', 'message' => 'I am away next Sunday. Please remove me from the rota and let me know if you need cover for later dates.'],
                    ['name' => 'Natalie Brooks', 'email' => 'natalie.brooks@example.com', 'subject' => 'Microphone Issue', 'category' => 'general', 'message' => 'The lectern microphone sounded quiet at the last Mass. Could it be checked before Sunday?'],
                ],
            ],
            'altar-servers' => [
                'members' => [
                    ['name' => 'Catherine Lee', 'email' => 'catherine.lee@example.com', 'phone' => '+44 7700 900401', 'role' => 'Coordinator'],
                    ['name' => 'Oliver James', 'email' => 'oliver.james@example.com', 'phone' => '+44 7700 900402', 'role' => 'Server'],
                    ['name' => 'Mia Roberts', 'email' => 'mia.roberts@example.com', 'phone' => '+44 7700 900403', 'role' => 'Server'],
                    ['name' => 'Ethan Johnson', 'email' => 'ethan.johnson@example.com', 'phone' => '+44 7700 900404', 'role' => 'Server'],
                ],
                'events' => [
                    [
                        'title' => 'Altar Servers Practice',
                        'description' => 'Practice for processions, handling candles, and supporting the liturgy with confidence.',
                        'start_date' => '2026-05-07',
                        'start_time' => '18:00:00',
                        'end_date' => '2026-05-07',
                        'end_time' => '19:00:00',
                        'location' => 'Sanctuary',
                        'status' => 'published',
                        'category' => 'liturgy',
                    ],
                    [
                        'title' => 'Rota Confirmation',
                        'description' => 'Confirm availability for weekend Masses and review responsibilities for feast days.',
                        'start_date' => '2026-05-14',
                        'start_time' => '18:15:00',
                        'end_date' => '2026-05-14',
                        'end_time' => '18:45:00',
                        'location' => 'Sacristy',
                        'status' => 'published',
                        'category' => 'liturgy',
                    ],
                    [
                        'title' => 'Serving at Confirmation Mass',
                        'description' => 'Arrival time and briefing for servers assisting at the diocesan confirmation Mass.',
                        'start_date' => '2026-05-24',
                        'start_time' => '16:00:00',
                        'end_date' => '2026-05-24',
                        'end_time' => '18:45:00',
                        'location' => $cathedral,
                        'status' => 'published',
                        'category' => 'liturgy',
                    ],
                ],
                'messages' => [
                    ['name' => 'Rebecca Stone', 'email' => 'rebecca.stone@example.com', 'subject' => 'Joining Altar Servers', 'category' => 'groups', 'message' => 'Hello, my son would like to become an altar server. What is the minimum age and how do we sign up?'],
                    ['name' => 'Ian Murray', 'email' => 'ian.murray@example.com', 'subject' => 'Cassocks and Surplices', 'category' => 'general', 'message' => 'Could you confirm where servers should collect vestments and whether they are laundered by the parish?'],
                    ['name' => 'Fiona Kelly', 'email' => 'fiona.kelly@example.com', 'subject' => 'Practice Times', 'category' => 'groups', 'message' => 'Please let me know the next practice time for new servers and what they should bring.'],
                    ['name' => 'Martin Shaw', 'email' => 'martin.shaw@example.com', 'subject' => 'Serving Rota Access', 'category' => 'groups', 'message' => 'Is there an online rota for serving, or will it be emailed each month?'],
                ],
            ],
            'rcia' => [
                'members' => [
                    ['name' => 'Patricia Morgan', 'email' => 'patricia.morgan@example.com', 'phone' => '+44 7700 900501', 'role' => 'Coordinator'],
                    ['name' => 'Kevin Wright', 'email' => 'kevin.wright@example.com', 'phone' => '+44 7700 900502', 'role' => 'Catechist'],
                    ['name' => 'Laura Phillips', 'email' => 'laura.phillips@example.com', 'phone' => '+44 7700 900503', 'role' => 'Sponsor'],
                    ['name' => 'Joshua Reed', 'email' => 'joshua.reed@example.com', 'phone' => '+44 7700 900504', 'role' => 'Member'],
                ],
                'events' => [
                    [
                        'title' => 'RCIA Session: The Creed',
                        'description' => 'A guided discussion on the Creed and what the Church believes and teaches.',
                        'start_date' => '2026-05-05',
                        'start_time' => '19:00:00',
                        'end_date' => '2026-05-05',
                        'end_time' => '20:30:00',
                        'location' => 'Parish Meeting Room',
                        'status' => 'published',
                        'category' => 'formation',
                    ],
                    [
                        'title' => 'RCIA Session: Sacraments',
                        'description' => 'An overview of the sacraments and how they shape Catholic life.',
                        'start_date' => '2026-05-12',
                        'start_time' => '19:00:00',
                        'end_date' => '2026-05-12',
                        'end_time' => '20:30:00',
                        'location' => 'Parish Meeting Room',
                        'status' => 'published',
                        'category' => 'formation',
                    ],
                    [
                        'title' => 'RCIA: Q&A Evening',
                        'description' => 'Open questions and answers with the parish priest and RCIA team.',
                        'start_date' => '2026-05-19',
                        'start_time' => '19:00:00',
                        'end_date' => '2026-05-19',
                        'end_time' => '20:15:00',
                        'location' => 'Parish Meeting Room',
                        'status' => 'published',
                        'category' => 'formation',
                    ],
                ],
                'messages' => [
                    ['name' => 'Alison Grant', 'email' => 'alison.grant@example.com', 'subject' => 'RCIA Start Dates', 'category' => 'sacraments', 'message' => 'Hello, I am interested in becoming Catholic. When does the next RCIA programme begin, and how do I register?'],
                    ['name' => 'Mohammed Ali', 'email' => 'mohammed.ali@example.com', 'subject' => 'Attending RCIA Sessions', 'category' => 'sacraments', 'message' => 'Could I attend RCIA sessions even if I am not yet sure about formal registration?'],
                    ['name' => 'Kelly Barnes', 'email' => 'kelly.barnes@example.com', 'subject' => 'Sponsors and Requirements', 'category' => 'sacraments', 'message' => 'Do I need a sponsor to join RCIA, and are there any documents required?'],
                    ['name' => 'Anthony Price', 'email' => 'anthony.price@example.com', 'subject' => 'Baptism as an Adult', 'category' => 'sacraments', 'message' => 'I was not baptised as a child. Could you explain how baptism works for adults and what preparation is involved?'],
                ],
            ],
            'st-vincent-de-paul' => [
                'members' => [
                    ['name' => 'Margaret Walsh', 'email' => 'margaret.walsh@example.com', 'phone' => '+44 7700 900601', 'role' => 'Coordinator'],
                    ['name' => 'Richard Doyle', 'email' => 'richard.doyle@example.com', 'phone' => '+44 7700 900602', 'role' => 'Volunteer'],
                    ['name' => 'Julie Howard', 'email' => 'julie.howard@example.com', 'phone' => '+44 7700 900603', 'role' => 'Volunteer'],
                    ['name' => 'Brian Stewart', 'email' => 'brian.stewart@example.com', 'phone' => '+44 7700 900604', 'role' => 'Member'],
                ],
                'events' => [
                    [
                        'title' => 'Harvest Food Bank Collection',
                        'description' => 'A parish collection of food and essential items for local families, coordinated by the St Vincent de Paul Society.',
                        'start_date' => '2025-09-28',
                        'start_time' => '09:00:00',
                        'end_date' => '2025-09-28',
                        'end_time' => '13:00:00',
                        'location' => 'Cathedral Porch',
                        'status' => 'published',
                        'category' => 'community',
                    ],
                    [
                        'title' => 'Home Visit Team Briefing',
                        'description' => 'Briefing and safeguarding reminder for volunteers joining home visits this month.',
                        'start_date' => '2026-05-11',
                        'start_time' => '18:30:00',
                        'end_date' => '2026-05-11',
                        'end_time' => '19:15:00',
                        'location' => 'Parish Office',
                        'status' => 'published',
                        'category' => 'community',
                    ],
                    [
                        'title' => 'Monthly Members Meeting',
                        'description' => 'Monthly meeting to review referrals, plan support, and coordinate local assistance.',
                        'start_date' => '2026-05-25',
                        'start_time' => '19:00:00',
                        'end_date' => '2026-05-25',
                        'end_time' => '20:00:00',
                        'location' => 'Parish Meeting Room',
                        'status' => 'published',
                        'category' => 'community',
                    ],
                ],
                'messages' => [
                    ['name' => 'Linda Shaw', 'email' => 'linda.shaw@example.com', 'subject' => 'Food Parcel Support', 'category' => 'general', 'message' => 'Hello, I would like to ask about support with food parcels. Could someone let me know what is available and how to access help?'],
                    ['name' => 'George Turner', 'email' => 'george.turner@example.com', 'subject' => 'Volunteering Opportunities', 'category' => 'volunteering', 'message' => 'I would like to volunteer with the St Vincent de Paul Society. Please advise what roles are available and the time commitment.'],
                    ['name' => 'Helen Wright', 'email' => 'helen.wright@example.com', 'subject' => 'Donation of Clothing', 'category' => 'general', 'message' => 'Do you accept clothing donations, and if so, where should they be dropped off?'],
                    ['name' => 'Philip Martin', 'email' => 'philip.martin@example.com', 'subject' => 'Support for Elderly Neighbour', 'category' => 'general', 'message' => 'I am concerned about an elderly neighbour who may need support. Could I speak with someone confidentially about next steps?'],
                ],
            ],
        ];

        // Seed for groups (ensures 4-6 members, 3-5 events, 4-6 messages per group)
        foreach ($groups as $group) {
            $key = $group->slug;
            $payload = $groupData[$key] ?? null;

            $creator = $groupAdmins->firstWhere('group_id', $group->id) ?? $mainAdmin;

            if (! $payload) {
                // For any group not listed above, add clean minimal data.
                $payload = [
                    'members' => [
                        ['name' => 'Alex Parker', 'email' => 'alex.parker@example.com', 'phone' => '+44 7700 900701', 'role' => 'Coordinator'],
                        ['name' => 'Emma Stone', 'email' => 'emma.stone@example.com', 'phone' => '+44 7700 900702', 'role' => 'Member'],
                        ['name' => 'Daniel Perry', 'email' => 'daniel.perry@example.com', 'phone' => '+44 7700 900703', 'role' => 'Member'],
                        ['name' => 'Chloe Adams', 'email' => 'chloe.adams@example.com', 'phone' => '+44 7700 900704', 'role' => 'Member'],
                    ],
                    'events' => [
                        [
                            'title' => $group->name . ' Meeting',
                            'description' => 'Monthly meeting to plan activities and coordinate volunteers.',
                            'start_date' => '2026-05-18',
                            'start_time' => '19:00:00',
                            'end_date' => '2026-05-18',
                            'end_time' => '20:00:00',
                            'location' => 'Parish Meeting Room',
                            'status' => 'published',
                            'category' => 'community',
                        ],
                        [
                            'title' => $group->name . ' Planning Session',
                            'description' => 'Planning session for upcoming parish activities and scheduling.',
                            'start_date' => '2026-05-26',
                            'start_time' => '19:00:00',
                            'end_date' => '2026-05-26',
                            'end_time' => '19:45:00',
                            'location' => 'Parish Meeting Room',
                            'status' => 'published',
                            'category' => 'community',
                        ],
                        [
                            'title' => $group->name . ' Volunteer Briefing',
                            'description' => 'Briefing for volunteers and new members, including safeguarding reminders as appropriate.',
                            'start_date' => '2026-05-30',
                            'start_time' => '10:30:00',
                            'end_date' => '2026-05-30',
                            'end_time' => '11:15:00',
                            'location' => 'Parish Hall',
                            'status' => 'published',
                            'category' => 'community',
                        ],
                    ],
                    'messages' => [
                        ['name' => 'Alice Bennett', 'email' => 'alice.bennett@example.com', 'subject' => 'Joining the Group', 'category' => 'groups', 'message' => 'Hello, I would like to join this parish group. Could you let me know when the next meeting is and who to contact?'],
                        ['name' => 'Daniel Wright', 'email' => 'daniel.wright@example.com', 'subject' => 'Meeting Time', 'category' => 'general', 'message' => 'Could you confirm the meeting time and location for this month?'],
                        ['name' => 'Sophie Collins', 'email' => 'sophie.collins@example.com', 'subject' => 'Volunteering', 'category' => 'volunteering', 'message' => 'I would like to volunteer and help where needed. Please let me know how I can get involved.'],
                        ['name' => 'Peter Hughes', 'email' => 'peter.hughes@example.com', 'subject' => 'Updates and Rota', 'category' => 'groups', 'message' => 'Is there a rota or mailing list for updates? Please add me if possible.'],
                    ],
                ];
            }

            foreach ($payload['members'] as $m) {
                GroupMember::create([
                    'group_id' => $group->id,
                    'created_by_user_id' => $creator->id,
                    'name' => $m['name'],
                    'email' => $m['email'],
                    'phone' => $m['phone'] ?? null,
                    'role' => $m['role'] ?? null,
                    'notes' => null,
                ]);
            }

            foreach ($payload['events'] as $e) {
                Event::create([
                    'title' => $e['title'],
                    'description' => $e['description'],
                    'start_date' => $e['start_date'],
                    'start_time' => $e['start_time'] ?? null,
                    'end_date' => $e['end_date'] ?? null,
                    'end_time' => $e['end_time'] ?? null,
                    'location' => $e['location'] ?? $cathedral,
                    'status' => $e['status'] ?? 'published',
                    'category' => $e['category'] ?? null,
                    'image_path' => null,
                    'group_id' => $group->id,
                    'created_by_user_id' => $creator->id,
                ]);
            }

            foreach ($payload['messages'] as $cm) {
                ContactMessage::create([
                    'name' => $cm['name'],
                    'email' => $cm['email'],
                    'phone' => $cm['phone'] ?? null,
                    'subject' => $cm['subject'],
                    'category' => $cm['category'] ?? 'general',
                    'status' => 'new',
                    'group_id' => $group->id,
                    'message' => $cm['message'],
                ]);
            }
        }

        // 4) Main-admin events and Mass times
        $mainAdminEvents = [
            [
                'title' => 'Parish Coffee Morning and Welcome',
                'description' => 'A community coffee morning after Sunday Mass to welcome new parishioners and visitors.',
                'start_date' => '2025-03-09',
                'start_time' => '12:05:00',
                'end_date' => '2025-03-09',
                'end_time' => '13:15:00',
                'location' => 'Parish Hall',
                'status' => 'published',
                'category' => 'community',
            ],
            [
                'title' => 'First Communion Parents Meeting',
                'description' => 'Meeting for parents and guardians to review the preparation schedule and key dates for First Communion.',
                'start_date' => '2026-05-14',
                'start_time' => '19:00:00',
                'end_date' => '2026-05-14',
                'end_time' => '20:00:00',
                'location' => 'Parish Hall',
                'status' => 'published',
                'category' => 'formation',
            ],
            [
                'title' => 'Confessions (Reconciliation)',
                'description' => 'The sacrament of reconciliation is available in the confessional before the Saturday evening Mass.',
                'start_date' => '2026-05-09',
                'start_time' => '17:15:00',
                'end_date' => '2026-05-09',
                'end_time' => '17:50:00',
                'location' => $cathedral,
                'status' => 'published',
                'category' => 'sacraments',
            ],
            [
                'title' => 'Parish Clean-Up Day',
                'description' => 'A morning of practical help around the cathedral and grounds. Gloves and tools are welcome.',
                'start_date' => '2026-05-23',
                'start_time' => '09:30:00',
                'end_date' => '2026-05-23',
                'end_time' => '12:30:00',
                'location' => $cathedral,
                'status' => 'published',
                'category' => 'community',
            ],
            [
                'title' => 'Pentecost Vigil Mass',
                'description' => 'A special vigil Mass for Pentecost with extended readings and hymns celebrating the Holy Spirit.',
                'start_date' => '2026-05-30',
                'start_time' => '19:30:00',
                'end_date' => '2026-05-30',
                'end_time' => '20:45:00',
                'location' => $cathedral,
                'status' => 'published',
                'category' => 'liturgy',
            ],
            [
                'title' => 'Baptism Preparation Session',
                'description' => 'Preparation session for parents and godparents ahead of infant baptism.',
                'start_date' => '2026-05-21',
                'start_time' => '19:00:00',
                'end_date' => '2026-05-21',
                'end_time' => '20:00:00',
                'location' => 'Parish Meeting Room',
                'status' => 'published',
                'category' => 'sacraments',
            ],
            [
                'title' => 'Adoration of the Blessed Sacrament',
                'description' => 'Quiet prayer before the Blessed Sacrament. Please enter and leave the cathedral quietly.',
                'start_date' => '2026-05-07',
                'start_time' => '18:30:00',
                'end_date' => '2026-05-07',
                'end_time' => '19:30:00',
                'location' => $cathedral,
                'status' => 'published',
                'category' => 'liturgy',
            ],
            [
                'title' => 'Parish Council Meeting',
                'description' => 'Monthly parish council meeting to review priorities, safeguarding updates, and upcoming events.',
                'start_date' => '2026-05-27',
                'start_time' => '19:00:00',
                'end_date' => '2026-05-27',
                'end_time' => '20:30:00',
                'location' => 'Parish Office',
                'status' => 'published',
                'category' => 'community',
            ],
        ];

        foreach ($mainAdminEvents as $e) {
            Event::create([
                'title' => $e['title'],
                'description' => $e['description'],
                'start_date' => $e['start_date'],
                'start_time' => $e['start_time'] ?? null,
                'end_date' => $e['end_date'] ?? null,
                'end_time' => $e['end_time'] ?? null,
                'location' => $e['location'] ?? $cathedral,
                'status' => $e['status'] ?? 'published',
                'category' => $e['category'] ?? null,
                'image_path' => null,
                'group_id' => null,
                'created_by_user_id' => $mainAdmin->id,
            ]);
        }

        $massSeeds = [
            ['day' => 'Sunday', 'start_time' => '08:30:00', 'end_time' => '09:30:00', 'language' => 'English'],
            ['day' => 'Sunday', 'start_time' => '11:00:00', 'end_time' => '12:00:00', 'language' => 'English'],
            ['day' => 'Sunday', 'start_time' => '17:30:00', 'end_time' => '18:30:00', 'language' => 'English'],
            ['day' => 'Monday', 'start_time' => '09:30:00', 'end_time' => '10:10:00', 'language' => 'English'],
            ['day' => 'Tuesday', 'start_time' => '09:30:00', 'end_time' => '10:10:00', 'language' => 'English'],
            ['day' => 'Wednesday', 'start_time' => '09:30:00', 'end_time' => '10:10:00', 'language' => 'English'],
            ['day' => 'Thursday', 'start_time' => '19:00:00', 'end_time' => '19:40:00', 'language' => 'English'],
            ['day' => 'Friday', 'start_time' => '09:30:00', 'end_time' => '10:10:00', 'language' => 'English'],
            ['day' => 'Saturday', 'start_time' => '10:00:00', 'end_time' => '10:40:00', 'language' => 'English'],
            ['day' => 'Saturday', 'start_time' => '18:00:00', 'end_time' => '19:00:00', 'language' => 'English'],
        ];

        foreach ($massSeeds as $seed) {
            MassTime::create([
                'day' => $seed['day'],
                'start_time' => $seed['start_time'],
                'end_time' => $seed['end_time'],
                'location' => $cathedral,
                'language' => $seed['language'],
                'notes' => null,
                'status' => 'published',
            ]);
        }

        // 5) Parish council members (realistic names/roles)
        $council = [
            ['name' => 'Fr Andrew Gallagher', 'role' => 'Parish Priest'],
            ['name' => 'Margaret O\'Brien', 'role' => 'Chair'],
            ['name' => 'Stephen Bennett', 'role' => 'Secretary'],
            ['name' => 'Anne Fitzgerald', 'role' => 'Treasurer'],
            ['name' => 'David Johnson', 'role' => 'Safeguarding Lead'],
            ['name' => 'Catherine Walsh', 'role' => 'Liturgy Representative'],
            ['name' => 'Peter Nolan', 'role' => 'Youth Representative'],
            ['name' => 'Louise Carter', 'role' => 'Community Outreach'],
            ['name' => 'James Murphy', 'role' => 'Facilities'],
            ['name' => 'Helen Reid', 'role' => 'Communications'],
        ];

        foreach ($council as $idx => $m) {
            ParishCouncilMember::create([
                'name' => $m['name'],
                'role' => $m['role'],
                'bio' => null,
                'photo_path' => null,
                'photo_filename' => null,
                'photo_size' => 0,
                'sort_order' => $idx,
                'is_active' => true,
            ]);
        }

        // 6) Parish registrations: 15, mixed individuals/families with different-aged children
        $registrations = [
            // Individuals
            [
                'registration_type' => 'individual',
                'full_name' => 'John Matthews',
                'date_of_birth' => '1982-11-14',
                'gender' => 'male',
                'nationality' => 'British',
                'occupation' => 'Electrician',
                'address_line1' => '12 Cedar Close',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'E1 6AN',
                'phone' => '+44 7700 901001',
                'email' => 'john.matthews@example.com',
                'partner_name' => null,
                'contact_by_phone' => true,
                'contact_by_email' => true,
            ],
            [
                'registration_type' => 'individual',
                'full_name' => 'Mary Richardson',
                'date_of_birth' => '1975-04-03',
                'gender' => 'female',
                'nationality' => 'Irish',
                'occupation' => 'Nurse',
                'address_line1' => '48 Kingsway',
                'address_line2' => 'Flat 3B',
                'city' => 'London',
                'postcode' => 'WC2B 6AA',
                'phone' => '+44 7700 901002',
                'email' => 'mary.richardson@example.com',
                'partner_name' => null,
                'contact_by_phone' => false,
                'contact_by_email' => true,
            ],
            [
                'registration_type' => 'individual',
                'full_name' => 'Pauline Stewart',
                'date_of_birth' => '1991-09-22',
                'gender' => 'female',
                'nationality' => 'British',
                'occupation' => 'Teacher',
                'address_line1' => '7 Orchard Road',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'N5 2JP',
                'phone' => '+44 7700 901003',
                'email' => 'pauline.stewart@example.com',
                'partner_name' => null,
                'contact_by_phone' => true,
                'contact_by_email' => true,
            ],
            [
                'registration_type' => 'individual',
                'full_name' => 'David Clarke',
                'date_of_birth' => '1968-02-19',
                'gender' => 'male',
                'nationality' => 'British',
                'occupation' => 'Accountant',
                'address_line1' => '22 Riverside Walk',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'SE1 2BY',
                'phone' => '+44 7700 901004',
                'email' => 'david.clarke@example.com',
                'partner_name' => null,
                'contact_by_phone' => false,
                'contact_by_email' => true,
            ],
            [
                'registration_type' => 'individual',
                'full_name' => 'Aisha Malik',
                'date_of_birth' => '1988-06-07',
                'gender' => 'female',
                'nationality' => 'British',
                'occupation' => 'Software Engineer',
                'address_line1' => '3 Willow Gardens',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'E3 4QT',
                'phone' => '+44 7700 901005',
                'email' => 'aisha.malik@example.com',
                'partner_name' => null,
                'contact_by_phone' => true,
                'contact_by_email' => true,
            ],
            // Families
            [
                'registration_type' => 'family',
                'full_name' => 'Daniel Evans',
                'date_of_birth' => '1980-01-28',
                'gender' => 'male',
                'nationality' => 'British',
                'occupation' => 'Bus Driver',
                'address_line1' => '19 Brook Street',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'SW1A 2AA',
                'phone' => '+44 7700 901006',
                'email' => 'daniel.evans@example.com',
                'partner_name' => 'Rachel Evans',
                'contact_by_phone' => true,
                'contact_by_email' => true,
                'children' => [
                    ['child_name' => 'Sophie Evans', 'date_of_birth' => '2014-03-11', 'age' => 12],
                    ['child_name' => 'Oliver Evans', 'date_of_birth' => '2018-10-02', 'age' => 7],
                ],
            ],
            [
                'registration_type' => 'family',
                'full_name' => 'Christopher Green',
                'date_of_birth' => '1979-08-15',
                'gender' => 'male',
                'nationality' => 'British',
                'occupation' => 'Project Manager',
                'address_line1' => '5 Maple Crescent',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'NW3 1AA',
                'phone' => '+44 7700 901007',
                'email' => 'christopher.green@example.com',
                'partner_name' => 'Amelia Green',
                'contact_by_phone' => false,
                'contact_by_email' => true,
                'children' => [
                    ['child_name' => 'Noah Green', 'date_of_birth' => '2012-07-21', 'age' => 13],
                ],
            ],
            [
                'registration_type' => 'family',
                'full_name' => 'Samuel Turner',
                'date_of_birth' => '1985-12-06',
                'gender' => 'male',
                'nationality' => 'British',
                'occupation' => 'Chef',
                'address_line1' => '31 Station Road',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'E15 2NE',
                'phone' => '+44 7700 901008',
                'email' => 'samuel.turner@example.com',
                'partner_name' => 'Lucy Turner',
                'contact_by_phone' => true,
                'contact_by_email' => true,
                'children' => [
                    ['child_name' => 'Mia Turner', 'date_of_birth' => '2016-01-19', 'age' => 10],
                    ['child_name' => 'Ethan Turner', 'date_of_birth' => '2020-05-05', 'age' => 6],
                ],
            ],
            [
                'registration_type' => 'family',
                'full_name' => 'Kevin Murphy',
                'date_of_birth' => '1972-05-30',
                'gender' => 'male',
                'nationality' => 'Irish',
                'occupation' => 'Carpenter',
                'address_line1' => '77 High Street',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'N1 9GU',
                'phone' => '+44 7700 901009',
                'email' => 'kevin.murphy@example.com',
                'partner_name' => 'Patricia Murphy',
                'contact_by_phone' => true,
                'contact_by_email' => false,
                'children' => [
                    ['child_name' => 'Joshua Murphy', 'date_of_birth' => '2009-11-09', 'age' => 16],
                ],
            ],
            [
                'registration_type' => 'family',
                'full_name' => 'Thomas Campbell',
                'date_of_birth' => '1983-03-02',
                'gender' => 'male',
                'nationality' => 'British',
                'occupation' => 'Police Officer',
                'address_line1' => '14 Albert Road',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'SW16 5BH',
                'phone' => '+44 7700 901010',
                'email' => 'thomas.campbell@example.com',
                'partner_name' => 'Catherine Campbell',
                'contact_by_phone' => false,
                'contact_by_email' => true,
                'children' => [
                    ['child_name' => 'Ella Campbell', 'date_of_birth' => '2017-09-14', 'age' => 8],
                    ['child_name' => 'Jack Campbell', 'date_of_birth' => '2022-02-05', 'age' => 4],
                ],
            ],
            [
                'registration_type' => 'family',
                'full_name' => 'Stephen Bennett',
                'date_of_birth' => '1976-10-26',
                'gender' => 'male',
                'nationality' => 'British',
                'occupation' => 'Civil Engineer',
                'address_line1' => '9 Garden Lane',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'W3 8DT',
                'phone' => '+44 7700 901011',
                'email' => 'stephen.bennett@example.com',
                'partner_name' => 'Grace Bennett',
                'contact_by_phone' => true,
                'contact_by_email' => true,
                'children' => [
                    ['child_name' => 'Chloe Bennett', 'date_of_birth' => '2013-04-27', 'age' => 13],
                ],
            ],
            [
                'registration_type' => 'family',
                'full_name' => 'Peter Collins',
                'date_of_birth' => '1987-07-18',
                'gender' => 'male',
                'nationality' => 'British',
                'occupation' => 'Sales Manager',
                'address_line1' => '2 Rosewood Drive',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'HA1 1AA',
                'phone' => '+44 7700 901012',
                'email' => 'peter.collins@example.com',
                'partner_name' => 'Helen Collins',
                'contact_by_phone' => true,
                'contact_by_email' => true,
                'children' => [
                    ['child_name' => 'Oliver Collins', 'date_of_birth' => '2019-12-30', 'age' => 6],
                ],
            ],
            [
                'registration_type' => 'family',
                'full_name' => 'James Walker',
                'date_of_birth' => '1984-05-09',
                'gender' => 'male',
                'nationality' => 'British',
                'occupation' => 'Plumber',
                'address_line1' => '66 Lime Street',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'EC3M 7HR',
                'phone' => '+44 7700 901013',
                'email' => 'james.walker@example.com',
                'partner_name' => 'Emily Walker',
                'contact_by_phone' => false,
                'contact_by_email' => true,
                'children' => [
                    ['child_name' => 'Mia Walker', 'date_of_birth' => '2015-06-03', 'age' => 11],
                    ['child_name' => 'Ethan Walker', 'date_of_birth' => '2011-01-17', 'age' => 15],
                ],
            ],
            [
                'registration_type' => 'family',
                'full_name' => 'Rachel Evans',
                'date_of_birth' => '1982-02-12',
                'gender' => 'female',
                'nationality' => 'British',
                'occupation' => 'Pharmacist',
                'address_line1' => '19 Brook Street',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'SW1A 2AA',
                'phone' => '+44 7700 901014',
                'email' => 'rachel.evans@example.com',
                'partner_name' => 'Daniel Evans',
                'contact_by_phone' => true,
                'contact_by_email' => true,
                'children' => [
                    ['child_name' => 'Sophie Evans', 'date_of_birth' => '2014-03-11', 'age' => 12],
                    ['child_name' => 'Oliver Evans', 'date_of_birth' => '2018-10-02', 'age' => 7],
                ],
            ],
            [
                'registration_type' => 'family',
                'full_name' => 'Louise Carter',
                'date_of_birth' => '1990-03-25',
                'gender' => 'female',
                'nationality' => 'British',
                'occupation' => 'Graphic Designer',
                'address_line1' => '11 Park View',
                'address_line2' => null,
                'city' => 'London',
                'postcode' => 'E17 9QJ',
                'phone' => '+44 7700 901015',
                'email' => 'louise.carter@example.com',
                'partner_name' => 'Richard Carter',
                'contact_by_phone' => true,
                'contact_by_email' => true,
                'children' => [
                    ['child_name' => 'Ella Carter', 'date_of_birth' => '2021-08-22', 'age' => 4],
                ],
            ],
        ];

        foreach ($registrations as $r) {
            $registration = ParishRegistration::create([
                'registration_type' => $r['registration_type'],
                'member_id' => null,
                'full_name' => $r['full_name'],
                'date_of_birth' => $r['date_of_birth'],
                'gender' => $r['gender'],
                'nationality' => $r['nationality'] ?? null,
                'occupation' => $r['occupation'] ?? null,
                'address_line1' => $r['address_line1'],
                'address_line2' => $r['address_line2'] ?? null,
                'city' => $r['city'],
                'postcode' => $r['postcode'],
                'partner_name' => $r['partner_name'] ?? null,
                'phone' => $r['phone'],
                'email' => $r['email'],
                'contact_by_phone' => (bool) ($r['contact_by_phone'] ?? false),
                'contact_by_email' => (bool) ($r['contact_by_email'] ?? false),
                'consent_confirmed' => true,
                'signature' => $r['full_name'],
                'signed_date' => '2026-05-01',
            ]);

            ParishInterest::create([
                'registration_id' => $registration->id,
                'volunteering' => true,
                'parish_groups' => true,
                'sacramental_preparation' => $registration->registration_type === 'family',
                'weekly_newsletter' => true,
            ]);

            foreach (($r['children'] ?? []) as $child) {
                ParishChild::create([
                    'registration_id' => $registration->id,
                    'child_name' => $child['child_name'],
                    'date_of_birth' => $child['date_of_birth'],
                    'age' => $child['age'],
                ]);
            }
        }

        // 7) News posts (>=5) and newsletters (>=6), written in clear English
        $newsPosts = [
            [
                'title' => 'Pentecost Mass Times',
                'type' => 'announcement',
                'summary' => 'Please note the Mass schedule for Pentecost weekend.',
                'content' => 'Pentecost Vigil Mass will be celebrated on Saturday evening at 19:30. Sunday Masses remain at 08:30, 11:00, and 17:30.',
                'published_at' => '2026-05-02',
                'status' => 'published',
            ],
            [
                'title' => 'Food Bank Collection This Weekend',
                'type' => 'news',
                'summary' => 'Support local families by donating non-perishable food items after Mass.',
                'content' => 'The St Vincent de Paul Society will be collecting donations after each weekend Mass. Suggested items include tinned meals, pasta, rice, tea, coffee, and toiletries. Thank you for your generosity.',
                'published_at' => '2026-05-03',
                'status' => 'published',
            ],
            [
                'title' => 'Baptism Preparation Session',
                'type' => 'announcement',
                'summary' => 'Parents and godparents are invited to attend the next preparation session.',
                'content' => 'The next baptism preparation session will be held on Thursday evening at 19:00 in the parish meeting room. Please contact the parish office to register.',
                'published_at' => '2026-04-28',
                'status' => 'published',
            ],
            [
                'title' => 'Parish Clean-Up Day',
                'type' => 'news',
                'summary' => 'A morning of practical help around the cathedral and grounds.',
                'content' => 'We will meet at 09:30 on Saturday for a parish clean-up. Tasks include light gardening, litter picking, and tidying storage areas. Please bring gloves if you have them.',
                'published_at' => '2026-04-26',
                'status' => 'published',
            ],
            [
                'title' => 'First Communion Preparation Update',
                'type' => 'announcement',
                'summary' => 'A reminder of the next session and key dates.',
                'content' => 'The next First Communion session will take place this week. Parents are asked to attend the meeting on Thursday at 19:00. If you have any questions, please contact the parish office.',
                'published_at' => '2026-04-24',
                'status' => 'published',
            ],
        ];

        foreach ($newsPosts as $p) {
            NewsPost::create([
                'title' => $p['title'],
                'type' => $p['type'],
                'summary' => $p['summary'],
                'content' => $p['content'],
                'published_at' => $p['published_at'],
                'status' => $p['status'],
                'image_path' => null,
                'created_by_user_id' => $mainAdmin->id,
            ]);
        }

        $newsletters = [
            ['title' => 'Parish Newsletter - January 2026', 'publication_date' => '2026-01-05'],
            ['title' => 'Parish Newsletter - February 2026', 'publication_date' => '2026-02-02'],
            ['title' => 'Parish Newsletter - March 2026', 'publication_date' => '2026-03-02'],
            ['title' => 'Parish Newsletter - April 2026', 'publication_date' => '2026-04-06'],
            ['title' => 'Parish Newsletter - May 2026', 'publication_date' => '2026-05-04'],
            ['title' => 'Parish Newsletter - Pentecost Special Edition', 'publication_date' => '2026-05-30'],
        ];

        foreach ($newsletters as $n) {
            $filename = Str::slug($n['title']) . '.pdf';
            $filePath = 'newsletters/' . $filename;
            $fileSize = $this->createSampleNewsletterPdf($filePath, $n['title'], $n['publication_date']);

            Newsletter::create([
                'title' => $n['title'],
                'publication_date' => $n['publication_date'],
                'description' => 'Weekly parish news, Mass intentions, and upcoming events.',
                'file_path' => $filePath,
                'original_filename' => $filename,
                'file_size' => $fileSize,
                'status' => $n['publication_date'] > now()->toDateString() ? 'draft' : 'published',
            ]);
        }

        // Ensure at least 10 contact messages overall (already satisfied by group seeding).
        $existingContactCount = ContactMessage::query()->count();
        if ($existingContactCount < 10) {
            ContactMessage::create([
                'name' => 'Parish Office',
                'email' => 'office@example.com',
                'phone' => '+44 7700 909999',
                'subject' => 'Contact Message Placeholder',
                'category' => 'general',
                'status' => 'new',
                'group_id' => null,
                'message' => 'This record exists only to ensure a minimum sample dataset size.',
            ]);
        }
    }

    private function createSampleNewsletterPdf(string $relativePath, string $title, string $publicationDate): int
    {
        $fullPath = storage_path("app/private/{$relativePath}");
        $directory = dirname($fullPath);

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $safeTitle = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $title);
        $safeDate = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $publicationDate);
        $stream = "BT /F1 18 Tf 72 720 Td ({$safeTitle}) Tj 0 -32 Td /F1 12 Tf (Publication date: {$safeDate}) Tj 0 -28 Td (Sample parish newsletter PDF for local development.) Tj ET";
        $streamLength = strlen($stream);

        $pdf = "%PDF-1.4\n"
            . "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
            . "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
            . "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n"
            . "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
            . "5 0 obj << /Length {$streamLength} >> stream\n{$stream}\nendstream endobj\n"
            . "xref\n0 6\n0000000000 65535 f \n"
            . "trailer << /Root 1 0 R /Size 6 >>\nstartxref\n0\n%%EOF\n";

        file_put_contents($fullPath, $pdf);

        return filesize($fullPath) ?: strlen($pdf);
    }
}
