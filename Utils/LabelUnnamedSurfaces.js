/// Script engine API documentation
/// <reference path="C:/Program Files/Leica Geosystems/Cyclone 3DR/Script/JsDoc/Reshaper.d.ts" />

/*
 * Create a surface label at the center of each unnamed surface / SCP.
 *
 * Behavior:
 * - If objects are selected, only the selection is processed.
 * - Otherwise, all scene components are scanned.
 * - A component is considered a valid target when it exposes GetSurface() and GetCenter().
 * - A component is considered unnamed when its name is empty or still matches a generic default
 *   such as "Surface", "Surface 12", "SCP", or "SCP_12".
 */

var LABEL_GROUP_NAME = "Surface_Labels";
var LABEL_COMMENT = "AUTO_SURFACE_LABEL";

function isNullOrUndefined(value) {
    return value === null || value === undefined;
}

function isUnnamedSurfaceName(name) {
    if (isNullOrUndefined(name))
        return true;

    var trimmedName = ("" + name).replace(/^\s+|\s+$/g, "");
    if (trimmedName.length === 0)
        return true;

    return /^(surface|scp)(?:[ _-]*\d+)?$/i.test(trimmedName);
}

function isSurfaceLike(comp) {
    if (isNullOrUndefined(comp))
        return false;

    return typeof comp.GetSurface === "function" && typeof comp.GetCenter === "function";
}

function getTargetComponents() {
    var selectedComponents = SComp.FromSel();
    if (selectedComponents.length > 0)
        return selectedComponents;

    return SComp.All(2);
}

function createSurfaceLabel(comp) {
    var surfaceValue = comp.GetSurface();
    var centerPoint = comp.GetCenter();

    var label = SLabel.New(1, 1);
    label.SetColType([SLabel.Measure]);
    label.SetLineType([SLabel.Surface]);
    label.SetCol(0, [surfaceValue]);
    label.SetComment(LABEL_COMMENT);
    label.AttachToPoint(centerPoint);
    label.AddToDoc();
    label.MoveToGroup(LABEL_GROUP_NAME, true);

    return label;
}

function main() {
    var components = getTargetComponents();
    var createdCount = 0;
    var skippedCount = 0;

    for (var i = 0; i < components.length; i++) {
        var comp = components[i];

        if (!isSurfaceLike(comp)) {
            skippedCount++;
            continue;
        }

        var compName = "";
        try {
            compName = comp.GetName();
        } catch (nameError) {
            compName = "";
        }

        if (!isUnnamedSurfaceName(compName)) {
            skippedCount++;
            continue;
        }

        try {
            createSurfaceLabel(comp);
            createdCount++;
            print("✓ Surface label created for: " + (compName.length > 0 ? compName : "<unnamed surface>"));
        } catch (labelError) {
            skippedCount++;
            print("⚠ Could not label component index " + i + ": " + labelError.message);
        }
    }

    SDialog.Message(
        "Created labels: " + createdCount + "\nSkipped components: " + skippedCount +
        "\nGroup: " + LABEL_GROUP_NAME,
        SDialog.EMessageSeverity.Info,
        "Unnamed Surfaces"
    );
}

main();
