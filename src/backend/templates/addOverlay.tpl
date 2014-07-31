<div>
  <div class="row">
    <div class="col-xs-10">
      <p class="lead">Add new overlay</p>
    </div>
    <div class="col-xs-2">
      <button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
    </div>
  </div>
  <hr />
  <form class="form-inline" role="form">
    <div class="form-group">
      <label class="sr-only" for="name">Name</label>
      <input type="text" class="form-control" name="name" placeholder="Name" value="<%= overlay.get('name') %>">
    </div>
    <div class="form-group">
      <label class="sr-only" for="description">Description</label>
      <input type="text" class="form-control" name="description" placeholder="Description" value="<%= overlay.get('description') %>">
    </div>
    <div class="form-group" style="width: 200px; max-width: 200px; max-height: 34px; overflow: scroll;">
      <label class="sr-only" for="tags">Tags</label>
      <select multiple data-role="tagsinput" class="form-control" name="tags" placeholder="Tags"></select>
    </div>
    <div class="form-group">
      <label class="sr-only" for="type">Type</label>
      <select class="form-control">
        <option value="image">Image</option>
        <option value="video">Video</option>
        <option value="html">HTML</option>
      </select>
    </div>
    <div class="form-group">
      <label class="sr-only" for="url">URL</label>
      <input type="text" class="form-control" name="url" placeholder="URL" value="<%= overlay.get('url') %>">
    </div>
    <div class="form-group">
      <label class="sr-only" for="w">Width</label>
      <input type="text" class="form-control" name="w" placeholder="Width (px)" value="<%= overlay.get('w') %>">
    </div>
    <div class="form-group">
      <label class="sr-only" for="h">Height</label>
      <input type="text" class="form-control" name="h" placeholder="Height (px)" value="<%= overlay.get('h') %>">
    </div>
    <button type="button" class="btn btn-primary save">Save</button>
  </form>
  <hr />
  <video id="iPED-Video" autoplay="autoplay" loop="loop">
    <source src="<%= video.get('url') + '.mp4' %>" type="video/mp4">
    <source src="<%= video.get('url') + '.ogv' %>" type="video/ogv">
  </video>
</div>