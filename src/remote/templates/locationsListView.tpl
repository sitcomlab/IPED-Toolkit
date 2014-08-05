<div>
  <% locations.forEach(function(location) { %>
    <button type="button" class="btn btn-default location" data-location="<%= location.get('id') %>">
      <%= location.get('name') %>
    </button>
  <% }) %>
</div>