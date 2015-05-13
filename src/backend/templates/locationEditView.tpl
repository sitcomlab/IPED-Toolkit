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

<br>
    <form class="form-horizontal" role="form">

        <!-- General data panel -->
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">General data</h3>
            </div>

            <div class="panel-body">

                <div class="form-group">
                    <label class="col-sm-3 control-label">ID</label>
                    <div class="col-sm-9">
                        <% if(typeof location.get( 'id') !=='undefined' ) { %>
                            <input type="text" class="form-control" disabled style="cursor:default;" value="<%=location.get( 'id') %>" name="id">
                                <% } %>
                    </div>
                </div>

                <div class="form-group">
                    <label for="name" class="col-sm-3 control-label">Name</label>
                    <div class="col-sm-9">
                        <input type="text" class="form-control" value="<%= location.get('name') %>" name="name" placeholder="Name">
                    </div>
                </div>

                <div class="form-group">
                    <label class="col-sm-3 control-label">Location</label>
                    <div class="col-sm-9">
                        (
                        <%=location.get( 'lat') %>,
                            <%=location.get( 'lon') %>)
                    </div>
                </div>

                <div class="form-group">
                    <label for="tags" class="col-sm-3 control-label">Tags</label>
                    <div class="col-sm-9">
                        <select multiple data-role="tagsinput" name="tags" placeholder="Tags"></select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="description" class="col-sm-3 control-label">Description</label>
                    <div class="col-sm-9">
                        <textarea class="form-control" rows="3" name="description" placeholder="Description"><%=location.get( 'description') %></textarea>
                    </div>
                </div>
            </div>
        </div>

        <!-- Related Locations panel -->
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">Related locations</h3>
            </div>

            <div class="relatedLocations"></div>

            <div class="panel-body">
                <div class="form-group form-group-sm">
                    <div class="col-xs-4">
                        <!--<button type="button" class="btn btn-primary btn-sm add-relatedLocations">
                            <span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span> New</button>-->
                    </div>
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-primary btn-sm edit-relatedLocations">
                            <span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> Edit</button>
                    </div>
                    <div class="col-xs-4">
                        <!--<button type="button" class="btn btn-danger btn-sm delete-relatedLocations">
                            <span class="glyphicon glyphicon-trash" aria-hidden="true"></span> Delete</button>-->
                    </div>
                </div>
            </div>

        </div>

        <!-- Video panel -->
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">Video footage</h3>
            </div>

            <div class="panel-body">
                <div class="form-group">

                    <div class="col-sm-12">
                        <select class="form-control videos" name="videos[0]"></select>
                    </div>

                </div>

                <div class="form-group form-group-sm">
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-primary btn-sm add-video">
                            <span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span> New</button>
                    </div>
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-primary btn-sm edit-video">
                            <span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> Edit</button>
                    </div>
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-danger btn-sm delete-video">
                            <span class="glyphicon glyphicon-trash" aria-hidden="true"></span> Delete</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Overlay panel -->
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">Overlays</h3>
            </div>

            <div class="panel-body">

                <div class="form-group">
                    <div class="col-sm-12">
                        <select multiple class="form-control overlays" name="overlays"></select>
                    </div>
                </div>

                <div class="form-group form-group-sm">
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-primary btn-sm add-overlay">
                            <span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span> New</button>
                    </div>
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-primary btn-sm edit-overlay">
                            <span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> Edit</button>
                    </div>
                    <div class="col-xs-4">
                        <button type="button" class="btn btn-danger btn-sm delete-overlay">
                            <span class="glyphicon glyphicon-trash" aria-hidden="true"></span> Delete</button>
                    </div>
                </div>
            </div>
        </div>


<div class="row">
    <div class="col-sm-6">
        <button type="button" class="btn btn-default cancel" style="display: block; width: 100%;">
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Cancel</button>
    </div>
    <div class="col-sm-6">
        <button type="button" class="btn btn-success save" style="display: block; width: 100%;">
            <span class="glyphicon glyphicon-floppy-disk" aria-hidden="true"></span> Save</button>
    </div>
</div>
</form>
