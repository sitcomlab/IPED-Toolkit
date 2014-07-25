<h1><%= name %></h1>

<form class="form-horizontal" role="form">
  <div class="form-group">
    <label for="ID" class="col-xs-5 control-label">ID</label>
    <div class="col-xs-7">
      <p class="form-control-static"><%= id %></p>
    </div>
  </div>
  <div class="form-group">
    <label for="Location" class="col-xs-5 control-label">Location</label>
    <div class="col-xs-7">
      <p class="form-control-static">(<%= lat %>, <%= lon %>)</p>
    </div>
  </div>
  <div class="form-group">
    <label for="Description" class="col-xs-5 control-label">Description</label>
    <div class="col-xs-7">
      <p class="form-control-static" style="max-height: 100px; overflow: scroll;"><%= description %></p>
    </div>
  </div>
  <div class="form-group">
    <label for="Tags" class="col-xs-5 control-label">Tags</label>
    <div class="col-xs-7">
      <input type="text" value="" data-role="tagsinput" disabled="disabled"/>
    </div>
  </div>
  <div class="form-group">
    <div class="col-xs-6">
      <button type="button" class="btn btn-primary btn-sm add">Add new</button>
      <button type="button" class="btn btn-primary btn-sm edit">Edit</button>
    </div>
    <div class="col-xs-6">
      <button type="button" class="btn btn-danger btn-sm delete pull-right">Delete</button>
    </div>
  </div>
</form>