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
    <form role="form">
        <div class="row">
            <div class="col-xs-6">
                <label class="sr-only" for="name">Name</label>
            </div>
            <div class="col-xs-6">
                <input type="text" class="form-control" name="name" placeholder="Name" value="<%= video.get('name') %>">
            </div>
        </div>
        <div class="row">
            <div class="col-xs-6">
                <label class="sr-only" for="description">Description</label>
            </div>
            <div class="col-xs-6">
                <input type="text" class="form-control" name="description" placeholder="Description" value="<%= video.get('description') %>">
            </div>
        </div>
        <div class="row">
            <div class="col-xs-6">
                <label class="sr-only" for="url">URL</label>
            </div>
            <div class="col-xs-6">
                <input type="text" class="form-control" name="url" placeholder="URL" value="<%= video.get('url') %>">
            </div>
        </div>
        <div class="row">
            <div class="col-xs-6">
                <label class="sr-only" for="w">Date</label>
            </div>
            <div class="col-xs-6">
                <input type="text" class="form-control" name="w" placeholder="Date" value="<%= video.get('date') %>">
            </div>
        </div>
        <div class="row">
            <div class="col-xs-6">
                <label class="sr-only" for="tags">Tags</label>
            </div>
            <div class="col-xs-6">
                <select multiple data-role="tagsinput" class="form-control" name="tags" placeholder="Tags"></select>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-2">
                <button type="button" class="btn btn-success save" style="display: block; width: 100%;">Save</button>
            </div>
        </div>
    </form>
</div>
