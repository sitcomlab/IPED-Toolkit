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
            <label for="tags" class="col-sm-3 control-label">Intents</label>
            <div class="col-sm-9">
                <select multiple data-role="tagsinput" name="intents" placeholder="Intents"></select>
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
