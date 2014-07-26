<!-- Nav tabs -->
<ul class="nav nav-tabs" role="tablist">
<% _.each(locations, function(location, index) { %>
  <li class="<% if(index == 0) {print('active')} %>"><a href="#<%= location.get('id') %>" role="tab" data-toggle="tab"><%= location.get('name') %></a></li>
<% }) %>
</ul>

<!-- Tab panes -->
<div class="tab-content">
<% _.each(locations, function(location, index) { %>
  <div class="tab-pane <% if(index == 0) {print('active')} %>" id="<%= location.get('id') %>">
    <h1><%= location.get('name') %></h1>

    <form class="form-horizontal" role="form">
      <div class="form-group">
        <label for="ID" class="col-xs-5 control-label">ID</label>
        <div class="col-xs-7">
          <p class="form-control-static"><%= location.get('id') %></p>
        </div>
      </div>
      <div class="form-group">
        <label for="Location" class="col-xs-5 control-label">Location</label>
        <div class="col-xs-7">
          <p class="form-control-static">(<%= location.get('lat') %>, <%= location.get('lon') %>)</p>
        </div>
      </div>
      <div class="form-group">
        <label for="Description" class="col-xs-5 control-label">Description</label>
        <div class="col-xs-7">
          <p class="form-control-static" style="max-height: 100px; overflow: scroll;"><%= location.get('description') %></p>
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
  </div>
<% }) %>
</div>