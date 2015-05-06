<div>
  <div class="row">
    <div class="col-xs-10">
      <p class="lead"><%= title %></p>
    </div>
    <div class="col-xs-2">
      <button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
    </div>
  </div>
  <hr />
  <form role="form">
    <div class="row">
      <div class="col-sm-3 form-group">
        <label class="sr-only" for="name">Name</label>
        <input type="text" class="form-control" name="name" placeholder="Name" value="<%= overlay.get('name') %>">
      </div>
      <div class="col-sm-3 form-group">
        <label class="sr-only" for="description">Description</label>
        <input type="text" class="form-control" name="description" placeholder="Description" value="<%= overlay.get('description') %>">
      </div>
      <div class="col-sm-1 form-group">
        <label class="sr-only" for="type">Type</label>
        <select class="form-control" name="type">
          <option value="image" <% if (overlay.get('type') == 'image') print('selected="selected"') %>>Image</option>
          <option value="video" <% if (overlay.get('type') == 'video') print('selected="selected"') %>>Video</option>
          <option value="html"  <% if (overlay.get('type') == 'html') print('selected="selected"') %>>HTML</option>
        </select>
      </div>
      <div class="col-sm-3 form-group">
        <label class="sr-only" for="url">URL</label>
        <input type="text" class="form-control" name="url" placeholder="URL" value="<%= overlay.get('url') %>">
      </div>
      <div class="col-sm-1 form-group">
        <label class="sr-only" for="w">Width</label>
        <input type="text" class="form-control" name="w" placeholder="Width (px)" value="<%= overlay.get('w') %>">
      </div>
      <div class="col-sm-1 form-group">
        <label class="sr-only" for="h">Height</label>
        <input type="text" class="form-control" name="h" placeholder="Height (px)" value="<%= overlay.get('h') %>">
      </div>
    </div>
    <div class="row">
      <div class="col-sm-10 form-group">
        <label class="sr-only" for="tags">Tags</label>
        <select multiple data-role="tagsinput" class="form-control" name="tags" placeholder="Tags"></select>
      </div>
      <div class="col-sm-2">
        <button type="button" class="btn btn-success save" style="display: block; width: 100%;">Save</button>
      </div>
    </div>
  </form>
  <hr />
  <video id="iPED-Video"> <!--autoplay="autoplay" loop="loop"-->
    <source src="<%= video.get('url') + '.mp4' %>" type="video/mp4">
    <source src="<%= video.get('url') + '.ogg' %>" type="video/ogg">
  </video>
</div>
