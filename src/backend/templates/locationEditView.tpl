<form class="form-horizontal" role="form">
  <div class="form-group">
    <label for="_id" class="col-xs-5 control-label">ID</label>
    <div class="col-xs-7">
      <p class="form-control-static"><% if(typeof id !== 'undefined') { %> <%= id %> <% } %></p>
    </div>
  </div>
  <div class="form-group">
    <label for="name" class="col-xs-5 control-label">Name</label>
    <div class="col-xs-7">
      <input type="text" class="form-control" value="<%= name %>" name="name">
    </div>
  </div>
  <div class="form-group">
    <label for="lat_lon" class="col-xs-5 control-label">Location</label>
    <div class="col-xs-7">
      <p class="form-control-static">(<%= lat %>, <%= lon %>)</p>
    </div>
  </div>
  <div class="form-group">
    <label for="description" class="col-xs-5 control-label">Description</label>
    <div class="col-xs-7">
      <textarea class="form-control" rows="3" name="description"><%= description %></textarea>
    </div>
  </div>
  <div class="form-group">
    <label for="tags" class="col-xs-5 control-label">Tags</label>
    <div class="col-xs-7">
      <select multiple data-role="tagsinput" name="tags">
        
      </select>
    </div>
  </div>
  <div class="form-group">
    <div class="col-xs-6">
      <button type="button" class="btn btn-success btn-sm save">Save</button>
    </div>
  </div>
</form>