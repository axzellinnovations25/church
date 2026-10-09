<?php
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Models\{User,Group,GalleryImage};
use Illuminate\Support\Facades\Storage;
Storage::disk('local')->put('qa-active.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='));
$admin=User::updateOrCreate(['email'=>'qa-admin@example.test'],['name'=>'QA Admin','password'=>'QA-password-123!','is_main_admin'=>true]);
$active=Group::updateOrCreate(['slug'=>'qa-choir'],['name'=>'QA Choir','description'=>'Synthetic active group','is_active'=>true]);
Group::updateOrCreate(['slug'=>'qa-inactive'],['name'=>'QA Inactive','description'=>'Synthetic inactive group','is_active'=>false]);
GalleryImage::updateOrCreate(['title'=>'QA Active Image'],['caption'=>'Synthetic active record','image_path'=>'qa-active.png','image_filename'=>'qa-active.png','image_size'=>68,'sort_order'=>1,'is_active'=>true,'created_by_user_id'=>$admin->id]);
GalleryImage::updateOrCreate(['title'=>'QA Inactive Image'],['caption'=>'Synthetic inactive record','image_path'=>'qa-active.png','image_filename'=>'qa-active.png','image_size'=>68,'sort_order'=>2,'is_active'=>false,'created_by_user_id'=>$admin->id]);
echo json_encode(['admin_id'=>$admin->id,'group_id'=>$active->id,'db'=>config('database.connections.'.config('database.default').'.database')]);
