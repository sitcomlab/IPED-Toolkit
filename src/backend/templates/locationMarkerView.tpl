<!-- Nav tabs -->
<ul class="nav nav-tabs" role="tablist">
    <% locations.forEach(function(location, index) { %>
        <li class="<% if(index == 0) {print('active')} %>">
            <a href="#<%= location.get('id') %>" role="tab" data-toggle="tab">
                <b><%=location.get( 'name') %></b>
            </a>
        </li>
        <% }) %>
</ul>

<!-- Tab panes -->
<div class="tab-content">
    <% locations.forEach(function(location, index) { %>
        <div class="tab-pane <% if(index == 0) {print('active')} %>" id="<%= location.get('id') %>">
            <br>
            <form class="form-horizontal" role="form">
                <div class="panel-group" id="<% index %>">
                    <div class="panel panel-default">
                        <div class="panel-heading">

                            <a data-toggle="collapse" data-parent="<%= '#' + index %>" href="<%= '#generalData' + index %>">General data</a>

                        </div>
                        <div id="<%= 'generalData' + index %>" class="panel-collapse collapse">

                            <table class="table">
                                <tr>
                                    <th>ID</th>
                                    <td><%=location.get( 'id') %></td>
                                </tr>
                                <tr>
                                    <th>Location</th>
                                    <td>(<%=location.get( 'lat') %>, <%=location.get( 'lon') %>)</td>
                                </tr>
                                <tr>
                                    <th>Description</th>
                                    <td><%=location.get( 'description') %></td>
                                </tr>
                                <tr>
                                    <th>Tags</th>
                                    <td>
                                        <input type="text" value="" data-role="tagsinput" disabled="disabled" data-location="<%= location.get('id') %>" />
                                    </td>
                                </tr>
                            </table>

                        </div>
                    </div>


                    <div class="panel panel-default">
                        <div class="panel-heading">

                            <a data-toggle="collapse" data-parent="<%= '#' + index %>" href="<%= '#relatedLocations' + index %>">Related Locations data <span class="badge rightSide"><%= location.get('relatedLocations').length %></span></a>

                        </div>

                        <div id="<%= 'relatedLocations' + index %>" class="panel-collapse collapse">
                            <div class="clear"></div>
                            <div id="<%= '_relatedLocations' + location.get('id')  %>" data-location="<%= location.get('id') %>">
                                <img class="spinner" src="images/spinner_text.gif" />
                            </div>
                        </div>
                    </div>


                    <div class="panel panel-default">
                        <div class="panel-heading">

                            <a data-toggle="collapse" data-parent="<%= '#' + index %>" href="<%= '#videos' + index %>">Video footage <span class="badge rightSide"><%= location.get('videos').length %></span></a>

                        </div>

                        <div id="<%= 'videos' + index %>" class="panel-collapse collapse">
                            <div class="clear"></div>
                            <div id="<%= '_videos' + location.get('id')  %>" data-location="<%= location.get('id') %>">
                                <img class="spinner" src="images/spinner_text.gif" />
                            </div>
                        </div>

                    </div>



                    <div class="panel panel-default">
                        <div class="panel-heading">

                            <a data-toggle="collapse" data-parent="<%= '#' + index %>" href="<%= '#overlays' + index %>">Overlays <span class="badge rightSide"><%= location.get('overlays').length %></span></a>

                        </div>

                        <div id="<%= 'overlays' + index %>" class="panel-collapse collapse">
                            <div class="clear"></div>
                            <div id="<%= '_overlays' + location.get('id')  %>" data-location="<%= location.get('id') %>">
                                <img class="spinner" src="images/spinner_text.gif" />
                            </div>
                        </div>

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
