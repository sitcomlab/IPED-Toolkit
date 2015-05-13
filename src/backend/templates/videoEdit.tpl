<div>
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
    <hr />

    <form class="form-horizontal" role="form">

        <div class="form-group">
            <label for="name" class="col-sm-3 control-label">Name</label>
            <div class="col-sm-9">
                <input type="text" class="form-control" value="<%= video.get('name') %>" name="name" placeholder="Name">
            </div>
        </div>

        <div class="form-group">
            <label for="url" class="col-sm-3 control-label">URL</label>
            <div class="col-sm-9">
                <input type="text" class="form-control" value="<%=video.get( 'url') %>" name="url" placeholder="URL">
            </div>
        </div>

        <div class="form-group">
            <label for="date" class="col-sm-3 control-label">Date</label>
            <div class="col-sm-9">
                <input type="text" class="form-control" value="<%=video.get( 'date') %>" name="date" placeholder="dd/mm/jjjj">
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
                <textarea class="form-control" rows="3" placeholder="Description" name="description"><%=video.get( 'description') %></textarea>
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
</div>
