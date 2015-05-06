<div class="row">
    <div class="col-xs-10">
        <p class="lead">
            <%=title %>
        </p>
    </div>
    <div class="col-xs-2">
        <button type="button" class="close">
            <span aria-hidden="true">&times;</span>
            <span class="sr-only">Close</span>
        </button>
    </div>
</div>
<div class="row2">
    <form class="form-horizontal" role="form">

        <!-- General data panel -->
        <div class="panel panel-default editViewTable">
            <div class="panel-heading">
                <h3 class="panel-title">General data</h3>
            </div>

            <table class="table">
                <tbody>
                    <tr>
                        <th>ID</th>
                        <td>
                            <% if(typeof location.get( 'id') !=='undefined' ) { %>
                                <%=location.get( 'id') %>
                                    <% } %>
                        </td>
                    </tr>
                    <tr>
                        <th>Name</th>
                        <td>
                            <input type="text" class="form-control" value="<%= location.get('name') %>" name="name">
                        </td>
                    </tr>
                    <tr>
                        <th>Location</th>
                        <td>
                            (
                            <%=location.get( 'lat') %>,
                                <%=location.get( 'lon') %>)
                        </td>
                    </tr>
                    <tr>
                        <th>Description</th>
                        <td>
                            <textarea class="form-control" rows="3" name="description" placeholder="Description">
                                <%=location.get('description') %>
                            </textarea>
                        </td>
                    </tr>
                    <tr>
                        <th>Tags</th>
                        <td>
                            <select multiple data-role="tagsinput" name="tags"></select>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Related Locations panel -->
        <div class="panel panel-default editViewTable">
            <div class="panel-heading">
                <h3 class="panel-title">Related locations</h3>
            </div>

            <div class="relatedLocations"></div>
        </div>

        <!-- Video panel -->
        <div class="panel panel-default editViewTable">
            <div class="panel-heading">
                <h3 class="panel-title">Video footage</h3>
            </div>

            <div class="panel-body">
                <select class="form-control videos"></select>
                <br>
                <div class="form-group form-group-sm">
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-primary btn-sm add-video"><span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span> New</button>
                    </div>
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-primary btn-sm edit-video"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> Edit</button>
                    </div>
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-danger btn-sm delete-video"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span> Delete</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Overlay panel -->
        <div class="panel panel-default editViewTable">
            <div class="panel-heading">
                <h3 class="panel-title">Overlays</h3>
            </div>

            <div class="panel-body">
                <select multiple class="form-control overlays"></select>
                <br>
                <div class="form-group form-group-sm">
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-primary btn-sm add-overlay"><span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span> New</button>
                    </div>
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-primary btn-sm edit-overlay"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> Edit</button>
                    </div>
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-danger btn-sm delete-overlay"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span> Delete</button>
                    </div>
                </div>
            </div>
        </div>

</div>
<div class="form-group form-group-sm">
    <div class="col-xs-8">
        <button type="button" class="btn btn-default btn-sm cancel">
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Cancel</button>
    </div>
    <div class="col-xs-4">
        <button type="button" class="btn btn-success btn-sm save">
            <span class="glyphicon glyphicon-floppy-disk" aria-hidden="true"></span> Save</button>
    </div>
</div>
</form>
