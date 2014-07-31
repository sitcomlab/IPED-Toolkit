<!-- Nav tabs -->
<ul class="nav nav-tabs" role="tablist">
<% locations.forEach(function(location, index) { %>
  <li class="<% if(index == 0) {print('active')} %>"><a href="#<%= location.get('id') %>" role="tab" data-toggle="tab"><%= location.get('name') %></a></li>
<% }) %>
</ul>

<!-- Tab panes -->
<div class="tab-content">
<% locations.forEach(function(location, index) { %>
  <div class="tab-pane <% if(index == 0) {print('active')} %>" id="<%= location.get('id') %>">
    <form class="form-horizontal" role="form">
      <h4>General data</h4>
      <div class="form-group form-group-sm">
        <label for="ID" class="col-xs-5 control-label">ID</label>
        <div class="col-xs-7">
          <p class="form-control-static"><%= location.get('id') %></p>
        </div>
      </div>
      <div class="form-group form-group-sm">
        <label for="Location" class="col-xs-5 control-label">Location</label>
        <div class="col-xs-7">
          <p class="form-control-static">(<%= location.get('lat') %>, <%= location.get('lon') %>)</p>
        </div>
      </div>
      <div class="form-group form-group-sm">
        <label for="Description" class="col-xs-5 control-label">Description</label>
        <div class="col-xs-7">
          <p class="form-control-static" style="max-height: 100px; overflow: scroll;"><%= location.get('description') %></p>
        </div>
      </div>
      <div class="form-group form-group-sm">
        <label for="Tags" class="col-xs-5 control-label">Tags</label>
        <div class="col-xs-7" style="max-height: 100px; overflow: scroll;">
          <input type="text" value="" data-role="tagsinput" disabled="disabled" data-location="<%= location.get('id') %>"/>
        </div>
      </div>
      
      <hr/>
      <h4>Video footage</h4>
      <div class="form-group form-group-sm">
        <div class="col-xs-12">
          <p class="form-control-static videos" data-location="<%= location.get('id') %>"><img class="spinner" src="images/spinner_text.gif"/></p>
        </div>
      </div>
      
      <hr/>
      <h4>Overlays</h4>
      <div class="form-group form-group-sm">
        <div class="col-xs-12">
          <p class="form-control-static overlays" data-location="<%= location.get('id') %>"><img class="spinner" src="images/spinner_text.gif"/></p>
        </div>
      </div>
      
      <div class="form-group form-group-sm">
        <div class="col-xs-6">
          <button type="button" class="btn btn-primary btn-sm add" data-location="<%= location.get('id') %>">Add state</button>
          <button type="button" class="btn btn-primary btn-sm edit" data-location="<%= location.get('id') %>">Edit</button>
        </div>
        <div class="col-xs-6">
          <button type="button" class="btn btn-danger btn-sm delete pull-right" data-location="<%= location.get('id') %>">Delete</button>
        </div>
      </div>
    </form>
  </div>
<% }) %>
</div>