<div class="row">
  <div class="col-xs-10">
    <p class="lead"><%= title %></p>
  </div>
  <div class="col-xs-2">
    <button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
  </div>
</div>

<form class="form-horizontal" role="form">
  <hr/>
  <h4>General data</h4>
  <div class="form-group form-group-sm">
    <label for="id" class="col-xs-5 control-label">ID</label>
    <div class="col-xs-7">
      <p class="form-control-static"><% if(typeof location.get('id') !== 'undefined') { %> <%= location.get('id') %> <% } %></p>
    </div>
  </div>
  <div class="form-group form-group-sm">
    <label for="name" class="col-xs-5 control-label">Name</label>
    <div class="col-xs-7">
      <input type="text" class="form-control" value="<%= location.get('name') %>" name="name">
    </div>
  </div>
  <div class="form-group form-group-sm">
    <label for="lat_lon" class="col-xs-5 control-label">Location</label>
    <div class="col-xs-7">
      <p class="form-control-static">(<%= location.get('lat') %>, <%= location.get('lon') %>)</p>
    </div>
  </div>
  <div class="form-group form-group-sm">
    <label for="description" class="col-xs-5 control-label">Description</label>
    <div class="col-xs-7">
      <textarea class="form-control" rows="3" name="description"><%= location.get('description') %></textarea>
    </div>
  </div>
  <div class="form-group form-group-sm">
    <label for="tags" class="col-xs-5 control-label">Tags</label>
    <div class="col-xs-7" style="max-height: 100px; overflow: scroll;">
      <select multiple data-role="tagsinput" name="tags"></select>
    </div>
  </div>
  
  <hr/>
  <h4>Video footage</h4>
  <div class="form-group form-group-sm">
    <div class="col-xs-12">
      <select class="form-control"></select>
    </div>
  </div>
  <div class="form-group form-group-sm">
    <div class="col-xs-12">
      <button type="button" class="btn btn-primary btn-sm add-video">Add new video footage</button>
    </div>
  </div>
  
  <hr/>
  <h4>Overlays</h4>
  <div class="form-group form-group-sm">
    <div class="col-xs-12">
      <select class="form-control"></select>
    </div>
  </div>
  <div class="form-group form-group-sm">
    <div class="col-xs-12">
      <button type="button" class="btn btn-primary btn-sm add-video">Add new overlay</button>
    </div>
  </div>
  
  <hr/>
  <div class="form-group form-group-sm">
    <div class="col-xs-6">
      <button type="button" class="btn btn-success btn-sm save">Save</button>
    </div>
  </div>
</form>