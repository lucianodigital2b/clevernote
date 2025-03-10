<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Folder extends Model
{
    /** @use HasFactory<\Database\Factories\FolderFactory> */
    use HasFactory;

    protected $fillable = ['user_id', 'name', 'parent_id'];
    
    public function notes() 
    { 
        return $this->hasMany(Note::class); 
    }
    
    public function children()
    {
        return $this->hasMany(Folder::class, 'parent_id');
    }
    
    public function parent()
    {
        return $this->belongsTo(Folder::class, 'parent_id');
    }
}
