

function getID (id){
    console.log(id);
    document.getElementById('deleteNote').value =id;
}

function edit(id){
    var title = document.getElementById('title'+id).innerHTML;
    console.log(title);
    var desc = document.getElementById('desc'+id).innerHTML;
    console.log(desc);
    document.getElementById('titleInput').value = title;
    document.getElementById('descInput').value = desc;
    document.getElementById('_id').value = id;   
}